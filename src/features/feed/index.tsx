import { getCollectionRef } from "@/lib/firestore";
import { Interaction } from "@/models/types";
import { useSubscribeCollection } from "@/util/firestore-hooks";
import React, { useMemo } from "react";
import { Message, MessageFeedView } from "./FeedView";

type Props = {
    roomId: string;
}

export const Feed: React.FC<Props> = ({roomId}) => {
    const chatCollection = useMemo(() => getCollectionRef(`rooms/${roomId}/chat`), [roomId]);
    const state = useSubscribeCollection(chatCollection);
    switch (state.status) {
        case "success":
            return <FeedSuccess chat={state.data.docs.map((e) => e.data())} />
    
        default:
            return null;
    }
}

const FeedSuccess: React.FC<{chat: Interaction[]}>  = ({chat}: {chat: Interaction[]}) => {
    const messages = chat.flatMap<Message>(({assistant,user}) => {
        const responses = assistant?.responses || (assistant?.response ? [assistant.response] : []);
        const assistantMessages: Message[] = [];
        for (const res of responses) {
            if(!res.type || res.type === "text"){
                assistantMessages.push({
                    user: "assistant",
                    text: res.content
                })
            }
            
        }
        return [
            {
                user: "you",
                text: user.message
            },
            ...assistantMessages
        ]
    })
    return <MessageFeedView messages={messages}  />
}