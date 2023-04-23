import React from "react";
import styles from "./styles.module.css";

export type Message =
  | {
      type: "yourMessage" | "otherMessage" | "assistantMessage";
      text: string;
    }
  | {
      type: "loading";
    };

type Props = {
  messages: Message[];
};

export const MessageFeedView: React.FC<Props> = ({ messages }) => {
  return (
    <div className={styles.messageFeed}>
      {messages.map((message, index) => {
        if (message.type === "loading") {
          return (
            <div key={index} className={styles.spinnerContainer}>
              <div className={styles.spinner}></div>
            </div>
          );
        }

        const isYourMessage = message.type === "yourMessage";
        const messageClass = isYourMessage ? styles.you : styles.other;
        const messageContainerClass = isYourMessage ? styles.yourMessageContainer : styles.otherMessageContainer;

        return (
          <div key={index} className={messageContainerClass}>
            <div className={messageClass}>
              <p className={styles.messageText}>{message.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
