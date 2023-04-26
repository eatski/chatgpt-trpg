import { getChatGptAssistantResponse } from "@/adapters/chatGptAssistantResponse";
import { store } from "@/lib/firestore";
import { UserCommand, Event, Scenario } from "@/models/types";
import { QueryDocumentSnapshot, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const resolveUserCommand = async (
  commandToResolve: QueryDocumentSnapshot<UserCommand>,
  history: (Event & { status: "done" })[],
  scenario: Scenario,
) => {
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
    ];
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
  await runTransaction(store, async (t) => {
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
};
