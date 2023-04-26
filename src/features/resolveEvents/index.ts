import { getChatGptAssistantResponse } from "@/adapters/chatGptAssistantResponse";
import { getCollectionRef, store } from "@/lib/firestore";
import { Scenario } from "@/models/types";
import { onSnapshot, orderBy, query, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const listenToEventsAndResolve = (roomId: string, scenario: Scenario) => {
    const collection = query(getCollectionRef(`rooms/${roomId}/events`), orderBy("createdAt"));
    return onSnapshot(collection, async (snapshot) => {
        const picked = snapshot.docs.find((item) => item.data().status === "waiting");
        if (!picked) {
          return;
        }
        const commandToResolve = picked;
        if (commandToResolve) {
          const history = snapshot.docs.flatMap<ChatCompletionRequestMessage>((item) => {
            const data = item.data();
            return data.status === "done"
              ? [
                  {
                    role: "user",
                    content: item.data().command,
                  },
                  {
                    role: "assistant",
                    content: JSON.stringify(data.response),
                  },
                ]
              : [];
          });
          const data = commandToResolve.data();
          const currentSceneName = snapshot.docs.reduce((acc, cur) => {
            const data = cur.data();
            return data.status === "done" &&  data.response?.changeScene || acc;
          }, "default");
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
          const assistantResponse = await getChatGptAssistantResponse(messages)
          runTransaction(store, async (t) => {
            const doc = await t.get(commandToResolve.ref);
            if (doc.data()?.status === "done") {
               return;
            }
            t.update(commandToResolve.ref, {
              ...data,
              type: "userCommand",
              response: assistantResponse,
              status: "done",
            });
          })
        }
    })
}