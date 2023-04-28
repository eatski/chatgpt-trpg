import { getCollectionRef } from "@/lib/firestore";
import { SessionEvent } from "@/models/types";
import { useSubscribeCollection } from "@/util/firestore-hooks";
import { orderBy, query } from "@firebase/firestore";
import React, { useMemo } from "react";
import { Message, MessageFeedView } from "./FeedView";

type Props = {
  roomId: string;
};

export const Feed: React.FC<Props> = ({ roomId }) => {
  const eventsCollection = useMemo(
    () => query(getCollectionRef(`rooms/${roomId}/events`), orderBy("createdAt")),
    [roomId],
  );
  const state = useSubscribeCollection(eventsCollection);
  switch (state.status) {
    case "success":
      return <FeedSuccess events={state.data.docs.map((e) => e.data())} />;
    default:
      return null;
  }
};

const FeedSuccess: React.FC<{ events: SessionEvent[] }> = ({ events }) => {
  const messages = events.flatMap<Message>((data) => {
    const messages: Message[] = [];
    if (data.type === "userCommand") {
      messages.push({
        type: "yourMessage",
        text: data.command,
      });
    }
    if (data.status === "done" || data.status === "processing") {
      const responses = data.response.responses;
      for (const res of responses) {
        if (!res.type || res.type === "text") {
          messages.push({
            type: "assistantMessage",
            text: res.content,
          });
        }
      }
      if(data.status === "processing"){
        messages.push({
          type: "loading",
        });
      }
    } else if(data.status === "waiting") {
      messages.push({
        type: "loading",
      });
    } else {
      messages.push({
        type: "assistantMessage",
        text: data.cause,
      });
    }
    return messages;
  });
  return <MessageFeedView messages={messages} />;
};
