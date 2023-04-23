import React from "react";
import { Scenario } from "@/models/types";
import { useSubmitChatGpt } from "./useSubmitChatGpt";
import { Feed } from "../feed";
import { SubmitMessage } from "../submitMessage";

type Props = {
  roomId: string;
  scenario: Scenario;
};

const Session: React.FC<Props> = ({ roomId, scenario }) => {
  const userId = "test";
  useSubmitChatGpt({ roomId, scenario });
  return (
    <section>
      <h2>{scenario.title}</h2>
      <p>{scenario.description}</p>
      <Feed roomId={roomId} />
      <SubmitMessage userId={userId} roomId={roomId} />
    </section>
  );
};

export { Session };
