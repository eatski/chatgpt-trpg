import { getCollectionRef } from "@/lib/firestore";
import { openai } from "@/lib/openapi";
import { assistantResponse } from "@/models/schema";
import { Scenario } from "@/models/types";
import { onSnapshot, setDoc } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";
import { useEffect, useMemo } from "react";

type Props = {
  roomId: string;
  scenario: Scenario;
};

export const useSubmitChatGpt = ({ roomId, scenario }: Props) => {
  const chatCollection = useMemo(() => getCollectionRef(`rooms/${roomId}/chat`), [roomId]);
  useEffect(() => {
    return onSnapshot(chatCollection, (snapshot) => {
      const chatNeedRes = snapshot.docs.find((item) => !item.data().assistant);
      if (chatNeedRes) {
        const history = snapshot.docs.flatMap<ChatCompletionRequestMessage>((item) => {
          const assistant = item.data().assistant;
          return assistant
            ? [
                {
                  role: "user",
                  content: item.data().user.message,
                },
                {
                  role: "assistant",
                  content: JSON.stringify(assistant),
                },
              ]
            : [];
        });
        const chat = chatNeedRes.data();
        openai
          .createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: scenario.scenes.default.systemPrompt,
              },
              ...history,
              {
                role: "user",
                content: chat.user.message,
              },
            ],
            temperature: 0.1,
          })
          .then((res) => {
            const content = res.data.choices[0].message?.content;
            if (!content) {
              throw new Error("error");
            }
            const parsed = JSON.parse(content);
            const assistantRes = assistantResponse.parse(parsed);
            setDoc(chatNeedRes.ref, {
              user: chat.user,
              assistant: assistantRes,
            });
          });
      }
    });
  }, [chatCollection, scenario]);
};
