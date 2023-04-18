import React from "react";
import { Scenario } from "@/models/types";

type Props = {
  roomId: string;
  scenario: Scenario;
};

const Chat: React.FC<Props> = ({ roomId, scenario }) => {
  return <section>
    <h2>Room: {roomId}</h2>
    <code>{JSON.stringify(scenario)}</code>
  </section>;
};

export { Chat };
