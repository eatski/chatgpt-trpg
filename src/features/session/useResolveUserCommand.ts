import { getCollectionRef } from "@/lib/firestore";
import { openai } from "@/lib/openapi";
import { assistantResponse } from "@/models/schema";
import { Scenario } from "@/models/types";
import { onSnapshot, orderBy, query, setDoc } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";
import { useEffect, useMemo } from "react";

type Props = {
  roomId: string;
  scenario: Scenario;
};

export const useResolveUserCommand = ({ roomId, scenario }: Props) => {
  const chatCollection = useMemo(
    () => query(getCollectionRef(`rooms/${roomId}/events`), orderBy("createdAt")),
    [roomId],
  );
  useEffect(() => {
    return onSnapshot(chatCollection, (snapshot) => {
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
        openai
          .createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: scenario.scenes[currentSceneName].systemPrompt,
              },
              ...history,
              {
                role: "user",
                content: data.command,
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
            const parsedResponse = assistantResponse.parse(parsed);
            setDoc(commandToResolve.ref, {
              ...data,
              type: "userCommand",
              response: parsedResponse,
            });
          });
      }
    });
  }, [chatCollection, scenario]);
};
