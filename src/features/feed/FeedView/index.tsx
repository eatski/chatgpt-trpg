import React from 'react';
import styles from './styles.module.css';

export type Message = {
  user: 'system' | 'you' | 'other' | 'assistant';
  text: string;
};

export type Props = {
  messages: Message[];
};

export const MessageFeedView: React.FC<Props> = ({ messages }) => {
  return (
    <div className={styles.messageFeed}>
      {messages.map((message, index) => {
        const isYou = message.user === 'you';
        const messageClass = isYou ? styles.you : styles.other;
        const messageContainerClass = isYou
          ? styles.youMessageContainer
          : styles.otherMessageContainer;

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
