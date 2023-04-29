/* eslint-disable no-case-declarations */
import { getChatGptJsonLStream } from "@/util/getChatGptJsonLStream";
import { store } from "@/lib/firestore";
import { jsonlItem } from "@/models/schema";
import { UserCommand, SessionEvent, Scenario, SessionEventDone } from "@/models/types";
import { CollectionReference, doc, QueryDocumentSnapshot, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const resolveUserCommand = async (
  collectionRef: CollectionReference<SessionEvent>,
  commandToResolve: QueryDocumentSnapshot<UserCommand>,
  history: SessionEventDone[],
  scenario: Scenario,
) => {
  const historyToPrompt = history.flatMap<ChatCompletionRequestMessage>((data) => {
    switch (data.type) {
      case "userCommand":
        return [
          {
            role: "user",
            content: data.command,
          },
          {
            role: "assistant",
            content: data.response.original,
          },
        ];
      case "changeScene":
        return [
          {
            role: "assistant",
            content: data.response.original,
          },
        ];
    }
  });
  const data = commandToResolve.data();
  const currentSceneName = history.reduce((acc, cur) => {
    return (cur.type === "changeScene" && cur.sceneName) || acc;
  }, "default");
  const scene = scenario.scenes[currentSceneName];
  if (!scene) {
    throw new Error(`scene [${currentSceneName}] not found`);
  }
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: scene.systemPrompt,
    },
    ...historyToPrompt,
    {
      role: "user",
      content: data.command,
    },
  ];
  const stream = await getChatGptJsonLStream(messages, jsonlItem);
  const processing = await runTransaction(store, async (t) => {
    const documentData = await t.get(commandToResolve.ref);
    const data = documentData.data();
    if (!data) {
      throw new Error("data is null");
    }
    if (data.status !== "waiting") {
      return false;
    }
    await t.update(commandToResolve.ref, {
      ...data,
      status: "processing",
      response: {
        original: "",
        responses: [],
      },
    });
    return true;
  });
  if (!processing) {
    return;
  }
  const reader = stream.getReader();
  const recursive = async () => {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    await runTransaction(store, async (t) => {
      const documentData = await t.get(commandToResolve.ref);
      const data = documentData.data();
      if (!data) {
        throw new Error("data is null");
      }
      if (data.status !== "processing") {
        return;
      }
      const newResponses = [...data.response.responses];
      switch (value.parsed.type) {
        case "message":
        case undefined:
          newResponses.push({
            type: "text",
            content: value.parsed.content,
            visibility: value.parsed.visibility || "public",
          });
          break;
        case "command":
          const newEventRef = doc(collectionRef);
          t.set(newEventRef, {
            type: "changeScene",
            createdAt: data.createdAt + 1,
            status: "waiting",
            sceneName: value.parsed.sceneName,
          });
          break;
        default:
          break;
      }
      await t.update(commandToResolve.ref, {
        ...data,
        response: {
          original: data.response.original + "\n" + value.original,
          responses: newResponses,
        },
      });
    });
    await recursive();
  };
  await recursive();
  await runTransaction(store, async (t) => {
    const documentData = await t.get(commandToResolve.ref);
    const data = documentData.data();
    if (!data) {
      throw new Error("data is null");
    }
    t.update(commandToResolve.ref, {
      ...data,
      status: "done",
    });
  });
};
