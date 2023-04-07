import React, { useState } from "react";
import { useRouter } from "next/router";
import { getRoomCollection, getScenarioCollection, Scenario } from "@/models/store_legacy";
import { addDoc } from "@firebase/firestore";
import { useSubscribeCollection } from "@/util/firestore-hooks";

type Props = {
  scenarios: {
    id: string;
    data: Scenario;
  }[];
};

const CreateRoom = ({ scenarios }: Props) => {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");

  const handleCreateRoom = async () => {
    setStatus("loading"); // ボタンをクリックした時にloading状態にする

    try {
      const scenario = scenarios.find((scenario) => scenario.id === selectedScenarioId);
      if (!scenario) {
        throw new Error("Scenario not found");
      }
      const roomRef = await addDoc(getRoomCollection(), {
        createdAt: new Date().getTime(),
        scenario: scenario.data,
      });
      router.push(`/rooms/${roomRef.id}`); // ルームページにリダイレクトする
    } catch (error) {
      setStatus("error"); // エラーが発生したら、エラーメッセージを表示する
      console.error("Error adding document: ", error);
    }
  };

  const handleSelectScenario = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedScenarioId(event.target.value);
  };

  const renderButtonContent = () => {
    switch (status) {
      case "loading":
        return "Loading...";
      case "error":
        return "Error creating room";
      default:
        return "Create Room";
    }
  };

  return (
    <div>
      <select onChange={handleSelectScenario}>
        <option value="">Select a scenario</option>
        {scenarios.map((scenario) => (
          <option key={scenario.id} value={scenario.id}>
            {scenario.data.title}
          </option>
        ))}
      </select>
      <button onClick={handleCreateRoom} disabled={status === "loading" || !selectedScenarioId}>
        {renderButtonContent()}
      </button>
    </div>
  );
};
const scenarioCollection = getScenarioCollection();

const CreateRoomPage = () => {
  const scenarios = useSubscribeCollection(scenarioCollection);

  switch (scenarios.status) {
    case "loading":
      return <p>Loading...</p>;
    case "error":
      return <p>Error occurred.</p>;
    case "not-found":
      return <p>Not found.</p>;
    default:
      // eslint-disable-next-line no-case-declarations
      const scenarioData = scenarios.data?.docs.map((doc) => ({ id: doc.id, data: doc.data() })) || [];
      return <CreateRoom scenarios={scenarioData} />;
  }
};

export default CreateRoomPage;
