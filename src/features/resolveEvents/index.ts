import { getChatGptAssistantResponse } from "@/adapters/chatGptAssistantResponse";
import { getCollectionRef, store } from "@/lib/firestore";
import { Scenario } from "@/models/types";
import { onSnapshot, orderBy, query, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const listenToEventsAndResolve = (roomId: string, scenario: Scenario) => {
    const collection = query(getCollectionRef(`rooms/${roomId}/events`), orderBy("createdAt"));
    return onSnapshot(collection, (snapshot) => {
        const currentSceneName = snapshot.docs.reduce((acc, cur) => {
          return cur.data().response?.changeScene || acc;
        }, "default");
        const commandToResolve = snapshot.docs.find((item) => !item.data().response);
        if (commandToResolve) {
          const history = snapshot.docs.flatMap<ChatCompletionRequestMessage>((item) => {
            const response = item.data().response;
            return response
              ? [
                  {
                    role: "user",
                    content: item.data().command,
                  },
                  {
                    role: "assistant",
                    content: JSON.stringify(response),
                  },
                ]
              : [];
          });
          const data = commandToResolve.data();
          const messages: ChatCompletionRequestMessage[] = [
            {
              role: "system",
              content: scenario.scenes[currentSceneName].systemPrompt,
            },
            ...history,
            {
              role: "user",
              content: data.command,
            },
          ]
          getChatGptAssistantResponse(messages)
            .then((assistantResponse) => {
              runTransaction(store, async (t) => {
                const doc = await t.get(commandToResolve.ref);
                if (doc.data()?.response) {
                   return;
                }
                t.update(commandToResolve.ref, {
                  ...data,
                  type: "userCommand",
                  response: assistantResponse,
                });
              })
            });
        }
    })
}