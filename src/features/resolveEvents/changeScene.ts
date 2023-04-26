import { getChatGptAssistantResponse } from "@/adapters/chatGptAssistantResponse";
import { store } from "@/lib/firestore";
import { Scenario, ChangeScene } from "@/models/types";
import { QueryDocumentSnapshot, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const resolveChangeScene = async (
  commandToResolve: QueryDocumentSnapshot<ChangeScene>,
  scenario: Scenario,
) => {
    const data = commandToResolve.data()
    const messages: ChatCompletionRequestMessage[] = [
        {
          role: "system",
          content: scenario.scenes[data.sceneName].systemPrompt,
        }
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
        t.update(commandToResolve.ref, {
          ...data,
          type: "changeScene",
          response: assistantResponse,
          status: "done",
        });
      });
};