import React, { useState } from "react";
import styles from "./styles.module.css";

export type Props = {
  onSubmit: (message: string) => void;
};

export const SubmitMessageView: React.FC<Props> = ({ onSubmit: onClick }) => {
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      onClick(message);
      setMessage("");
    }
  };

  return (
    <form className={styles.submitMessageForm} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.messageInput}
        value={message}
        onChange={handleChange}
        placeholder="Type your message here..."
      />
      <button type="submit" className={styles.submitButton}>
        Send
      </button>
    </form>
  );
};
