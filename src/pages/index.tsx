import React, { useState } from "react";
import { useRouter } from "next/router";
import { doc, writeBatch } from "@firebase/firestore";
import { Scenario } from "@/models/types";
import { getCollectionRef, store } from "@/lib/firestore";
import { GetServerSideProps } from "next";
import { readFile } from "fs/promises";
import { resolve } from "path";

type Props = {
  scenarios: {
    id: string;
    data: Scenario;
  }[];
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const getScene = async (directory: string, name: string) => {
    return {
      systemPrompt: (
        await readFile(resolve(process.cwd(), "mocks", "scenarios", directory, `${name}.md`), "utf-8")
      ).toString(),
    };
  };

  return {
    props: {
      scenarios: [
        // {
        //   id: "yaminabe",
        //   data: {
        //     title: "闇鍋",
        //     description: "闇鍋をするよ",
        //     scenes: {
        //       default: await getScene("yaminabe","default"),
        //       cooking: await getScene("yaminabe","cooking"),
        //       select: await getScene("yaminabe","select"),
        //       ending: await getScene("yaminabe","ending"),
        //     },
        //   },
        // },
        {
          id: "jsonl-sample",
          data: {
            title: "JSONL sample",
            description: "JSONL sample",
            scenes: {
              default: await getScene("jsonl-sample", "default"),
              battle: await getScene("jsonl-sample", "battle"),
            },
          },
        },
      ],
    },
  };
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
      const roomsCollection = getCollectionRef("rooms");
      const batch = writeBatch(store);
      const roomRef = doc(roomsCollection);
      const now = new Date().getTime();
      batch.set(roomRef, {
        createdAt: now,
        scenario: scenario.data,
      });
      const eventRef = getCollectionRef(`rooms/${roomRef.id}/events`);
      batch.set(doc(eventRef), {
        type: "changeScene",
        createdAt: now,
        status: "waiting",
        sceneName: "default",
      });
      await batch.commit();
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

export default CreateRoom;
