import { getCollectionRef } from "@/lib/firestore";
import { Event } from "@/models/types";
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

const FeedSuccess: React.FC<{ events: Event[] }> = ({ events }: { events: Event[] }) => {
  const messages = events.flatMap<Message>(({ response, command }) => {
    const assistantMessages: Message[] = [];
    if (response) {
      const responses = response?.responses || (response?.response ? [response.response] : []);
      for (const res of responses) {
        if (!res.type || res.type === "text") {
          assistantMessages.push({
            type: "assistantMessage",
            text: res.content,
          });
        }
      }
    } else {
      assistantMessages.push({
        type: "loading",
      });
    }
    return [
      {
        type: "yourMessage",
        text: command,
      },
      ...assistantMessages,
    ];
  });
  return <MessageFeedView messages={messages} />;
};
