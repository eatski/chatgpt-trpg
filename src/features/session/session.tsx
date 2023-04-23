import React, { useMemo } from "react";
import { Scenario } from "@/models/types";
import { addDoc } from "@firebase/firestore";
import { getCollectionRef } from "@/lib/firestore";
import { useSubscribeCollection } from "@/util/firestore-hooks";
import { useSubmitChatGpt } from "./useSubmitChatGpt";

type Props = {
  roomId: string;
  scenario: Scenario;
};

const Session: React.FC<Props> = ({ roomId, scenario }) => {
  const userId = "test";
  const chatCollection = useMemo(() => getCollectionRef(`rooms/${roomId}/chat`), [roomId]);

  const state = useSubscribeCollection(chatCollection);
  useSubmitChatGpt({ roomId, scenario });
  const [input, setInput] = React.useState<string>("");
  return (
    <section>
      <h2>{scenario.title}</h2>
      <p>{scenario.description}</p>
      {state.status === "success" ? <code>{JSON.stringify(state.data.docs.map((e) => e.data()))}</code> : null}
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
