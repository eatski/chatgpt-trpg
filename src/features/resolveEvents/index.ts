import { getChatGptAssistantResponse } from "@/adapters/chatGptAssistantResponse";
import { getCollectionRef, store } from "@/lib/firestore";
import { Scenario,Event } from "@/models/types";
import { onSnapshot, orderBy, query, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const listenToEventsAndResolve = (roomId: string, scenario: Scenario) => {
  const collection = query(getCollectionRef(`rooms/${roomId}/events`), orderBy("createdAt"));
  return onSnapshot(collection, async (snapshot) => {
    const picked = snapshot.docs.find((item) => item.data().status === "waiting");
    if (!picked) {
      return;
    }
    const history: (Event & {status: "done"})[] = [];
    for (const item of snapshot.docs.map(e => e.data())) {
      if (item.status === "done") {
        history.push(item);
      }
    }
    const commandToResolve = picked;
    const historyToPrompt = history.flatMap<ChatCompletionRequestMessage>((data) => {
      return [
        {
          role: "user",
          content: data.command,
        },
        {
          role: "assistant",
          content: JSON.stringify(data.response),
        },
      ]
    });
    const data = commandToResolve.data();
    const currentSceneName = history.reduce((acc, cur) => {
      return cur.response.changeScene || acc;
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
    });
  });
};
