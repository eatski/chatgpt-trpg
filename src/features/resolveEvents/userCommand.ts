import { getChatGptAssistantResponse } from "@/adapters/chatGptAssistantResponse";
import { store } from "@/lib/firestore";
import { UserCommand, Event, Scenario, EventDone } from "@/models/types";
import { CollectionReference, doc, QueryDocumentSnapshot, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const resolveUserCommand = async (
  collectionRef: CollectionReference<Event>,
  commandToResolve: QueryDocumentSnapshot<UserCommand>,
  history: EventDone[],
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
            ]
    }
  });
  const data = commandToResolve.data();
  const currentSceneName = history.reduce((acc, cur) => {
    return cur.type === "changeScene" && cur.sceneName || acc;
  }, "default");
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: scenario.scenes[currentSceneName].systemPrompt,
    },
    ...historyToPrompt,
    {
      role: "user",
      content: data.command,
    },
  ];
  const assistantResponse = await getChatGptAssistantResponse(messages);
  await runTransaction(store, async (t) => {
    const documentData = await t.get(commandToResolve.ref);
    const data = documentData.data();
    if(!data){
        throw new Error("data is null");
    }
    if (data.status === "done") {
      return;
    }
    if(assistantResponse.changeScene){
        const newEvent = doc(collectionRef);
        t.set(newEvent, {
            type: "changeScene",
            createdAt: data?.createdAt,
            status: "waiting",
            sceneName: assistantResponse.changeScene,
        });
    }
    t.update(commandToResolve.ref, {
      ...data,
      type: "userCommand",
      response: assistantResponse,
      status: "done",
    });
  });
};
