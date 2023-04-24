import { getCollectionRef } from "@/lib/firestore";
import { addDoc } from "@firebase/firestore";
import React from "react";
import { UserInterface } from "./ui";

export type Props = {
  roomId: string;
  userId: string;
};
export const SubmitCommand: React.FC<Props> = ({ roomId, userId }) => {
  const onSubmit = (command: string) => {
    const chatCollection = getCollectionRef(`rooms/${roomId}/events`);
    addDoc(chatCollection, {
      command,
      userId,
      createdAt: new Date().getTime(),
      type: "userCommand"
    });
  };
  return <UserInterface onSubmit={onSubmit} />;
};
