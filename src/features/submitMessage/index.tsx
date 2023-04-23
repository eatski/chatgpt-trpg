import { getCollectionRef } from "@/lib/firestore"
import { addDoc } from "@firebase/firestore"
import React from "react"
import { SubmitMessageView } from "./SubmitMessageView"

export type Props = {
    roomId: string
    userId: string
}
export const SubmitMessage: React.FC<Props> = ({roomId,userId}) => {
    const onSubmit = (message: string) => {
        const chatCollection = getCollectionRef(`rooms/${roomId}/chat`);
        addDoc(chatCollection, {
            user: {
              userId,
              message,
            },
            createdAt: new Date().getTime(),
          })
    }
    return <SubmitMessageView onSubmit={onSubmit} />

}