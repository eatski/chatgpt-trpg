import { getChatGptJsonResponse } from "@/adapters/chatGptAssistantResponse";
import { store } from "@/lib/firestore";
import { userCommandResponse } from "@/models/schema";
import { UserCommand, SessionEvent, Scenario, SessionEventDone } from "@/models/types";
import { CollectionReference, doc, QueryDocumentSnapshot, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const resolveUserCommand = async (
  collectionRef: CollectionReference<SessionEvent>,
  commandToResolve: QueryDocumentSnapshot<UserCommand>,
  history: SessionEventDone[],
  scenario: Scenario,
) => {
  const historyToPrompt = history.flatMap<ChatCompletionRequestMessage>((data) => {
    switch (data.type) {
      case "userCommand":
        return [
          {
            role: "user",
            content: data.command,
          },
          {
            role: "assistant",
            content: JSON.stringify(data.response),
          },
        ];
      case "changeScene":
        return [
          {
            role: "assistant",
            content: JSON.stringify(data.response),
          },
        ];
    }
  });
  const data = commandToResolve.data();
  const currentSceneName = history.reduce((acc, cur) => {
    return (cur.type === "changeScene" && cur.sceneName) || acc;
  }, "default");
  const scene = scenario.scenes[currentSceneName];
    if (!scene) {
        throw new Error(`scene [${currentSceneName}] not found`);
    }
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: scene.systemPrompt,
    },
    ...historyToPrompt,
    {
      role: "user",
      content: data.command,
    },
  ];
  const response = await getChatGptJsonResponse(messages,userCommandResponse).catch((e) => {
    console.error(e);
    return null;
  });
  await runTransaction(store, async (t) => {
    const documentData = await t.get(commandToResolve.ref);
    const data = documentData.data();
    if (!data) {
      throw new Error("data is null");
    }
    if (data.status !== "waiting") {
      return;
    }
    if(response){
        if (response.changeScene) {
            const newEvent = doc(collectionRef);
            t.set(newEvent, {
              type: "changeScene",
              createdAt: data?.createdAt,
              status: "waiting",
              sceneName: response.changeScene,
            });
          }
          t.update(commandToResolve.ref, {
            ...data,
            type: "userCommand",
            response: response,
            status: "done",
        });
    } else {
        t.update(commandToResolve.ref, {
            ...data,
            type: "userCommand",
            cause: "不正な入力です。",
            status: "failed",
        });
    }
  });
};
