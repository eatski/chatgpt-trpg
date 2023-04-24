import React from "react";
import { Scenario } from "@/models/types";
import { useResolveUserCommand } from "./useResolveUserCommand";
import { Feed } from "../feed";
import { SubmitCommand } from "../submitCommand";

type Props = {
  roomId: string;
  scenario: Scenario;
};

const Session: React.FC<Props> = ({ roomId, scenario }) => {
  const userId = "test";
  useResolveUserCommand({ roomId, scenario });
  return (
    <section>
      <h2>{scenario.title}</h2>
      <p>{scenario.description}</p>
      <Feed roomId={roomId} />
      <SubmitCommand userId={userId} roomId={roomId} />
    </section>
  );
};

export { Session };
