import React, { useMemo } from "react";
import { Scenario } from "@/models/types";
import { addDoc } from "@firebase/firestore";
import { getCollectionRef } from "@/lib/firestore";
import { useSubmitChatGpt } from "./useSubmitChatGpt";
import { Feed } from "../feed";

type Props = {
  roomId: string;
  scenario: Scenario;
};

const Session: React.FC<Props> = ({ roomId, scenario }) => {
  const userId = "test";
  const chatCollection = useMemo(() => getCollectionRef(`rooms/${roomId}/chat`), [roomId]);

  useSubmitChatGpt({ roomId, scenario });
  const [input, setInput] = React.useState<string>("");
  return (
    <section>
      <h2>{scenario.title}</h2>
      <p>{scenario.description}</p>
      <Feed roomId={roomId} />
      <div>
        <input
          value={input}
          onChange={async (e) => {
            setInput(e.target.value);
          }}
        ></input>
        {
          <button
            disabled={!input}
            onClick={() => {
              addDoc(chatCollection, {
                user: {
                  userId,
                  message: input,
                },
              }).then(() => {
                setInput("");
              });
            }}
          >
            送信
          </button>
        }
      </div>
    </section>
  );
};

export { Session };
