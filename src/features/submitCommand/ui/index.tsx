import React, { useState } from "react";
import styles from "./styles.module.css";

export type Props = {
  onSubmit: (message: string) => void;
};

export const UserInterface: React.FC<Props> = ({ onSubmit: onClick }) => {
  const [input, setInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      onClick(input);
      setInput("");
    }
  };

  return (
    <form className={styles.submitMessageForm} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.messageInput}
        value={input}
        onChange={handleChange}
        placeholder="Type your message here..."
      />
      <button type="submit" className={styles.submitButton}>
        Send
      </button>
    </form>
  );
};
