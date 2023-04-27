import { getChatGptJsonResponse } from "@/adapters/chatGptAssistantResponse";
import { store } from "@/lib/firestore";
import { changeSceneResponse } from "@/models/schema";
import { Scenario, ChangeScene } from "@/models/types";
import { QueryDocumentSnapshot, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const resolveChangeScene = async (commandToResolve: QueryDocumentSnapshot<ChangeScene>, scenario: Scenario) => {
  const data = commandToResolve.data();
  const scene = scenario.scenes[data.sceneName]; 
  if(!scene){
    await runTransaction(store, async (t) => {
        const documentData = await t.get(commandToResolve.ref);
        const data = documentData.data();
        if (!data) {
          throw new Error("data is null");
        }
        if (data.status === "done") {
          return;
        }
        t.update(commandToResolve.ref, {
          ...data,
          type: "changeScene",
          status: "failed",
          cause: `scene [${data.sceneName}] not found`
        });
      });
    return;
  }
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: scene.systemPrompt,
    },
  ];
  const response = await getChatGptJsonResponse(messages,changeSceneResponse);
  await runTransaction(store, async (t) => {
    const documentData = await t.get(commandToResolve.ref);
    const data = documentData.data();
    if (!data) {
      throw new Error("data is null");
    }
    if (data.status === "done") {
      return;
    }
    t.update(commandToResolve.ref, {
      ...data,
      type: "changeScene",
      response,
      status: "done",
    });
  });
};
