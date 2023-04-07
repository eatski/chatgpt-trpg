import React, { useEffect, useMemo, useState } from "react";
import { useSubscribeCollection } from "@/util/firestore-hooks";
import { ChatMessage, Scenario, getChatMessageCollection } from "@/models/store_legacy";
import { doc, orderBy, query, QuerySnapshot, runTransaction } from "@firebase/firestore";
import { openai } from "@/lib/openapi";
import { store } from "@/lib/firestore";

type Props = {
  roomId: string;
  scenario: Scenario;
};

const Chat: React.FC<Props> = ({ roomId, scenario }) => {
  const memorizedMessageCollection = useMemo(
    () => query(getChatMessageCollection(roomId), orderBy("createdAt")),
    [roomId],
  );
  const messages = useSubscribeCollection(memorizedMessageCollection);

  switch (messages.status) {
    case "loading":
      return <p>Loading...</p>;
    case "error":
      return <p>Error occurred.</p>;
    case "not-found":
      return <p>Message not found.</p>;
    default:
      return <ChatInner chatMessages={messages.data} scenario={scenario} roomId={roomId} />;
  }
};

const ChatInner: React.FC<{ chatMessages: QuerySnapshot<ChatMessage>; scenario: Scenario; roomId: string }> = ({
  chatMessages,
  scenario,
  roomId,
}) => {
  const [error, setError] = useState<boolean>(false);
  useEffect(() => {
    if (chatMessages.empty && !error) {
      const chatSeqNo = chatMessages.docs.length;
      openai
        .createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: scenario.initialPrompt.text,
              name: "user",
            },
          ],
        })
        .then((e) => {
          const content = e.data.choices[0].message?.content;
          if (!content) {
            throw new Error("response is empty");
          }
          const collection = getChatMessageCollection(roomId);

          return runTransaction(store, async (t) => {
            const documentRef = doc(collection, chatSeqNo.toString());
            const current = await t.get(documentRef);
            if (!current.exists()) {
              return t.set(documentRef, {
                text: content,
                createdAt: new Date().getTime(),
                author: "assistant",
              });
            }
          });
        })
        .catch((e) => {
          console.error(e);
          setError(true);
        });
    }
  }, [chatMessages, scenario.initialPrompt.text, error, roomId]);
  return (
    <div>
      <h2>チャット</h2>
      {chatMessages.docs.map((doc) => {
        const message = doc.data();
        return (
          <div key={doc.id}>
            <p>{message.text}</p>
            <p>{new Date(message.createdAt).toString()}</p>
            <p>{message.author}</p>
          </div>
        );
      })}
    </div>
  );
};

export { Chat };
