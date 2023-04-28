import { getChatGptJsonLStream } from "@/util/getChatGptJsonLStream";
import { store } from "@/lib/firestore";
import { jsonlItem } from "@/models/schema";
import { Scenario, ChangeScene } from "@/models/types";
import { QueryDocumentSnapshot, runTransaction } from "@firebase/firestore";
import { ChatCompletionRequestMessage } from "openai";

export const resolveChangeScene = async (commandToResolve: QueryDocumentSnapshot<ChangeScene>, scenario: Scenario) => {
  const data = commandToResolve.data();
  const scene = scenario.scenes[data.sceneName]; 
  if(!scene){
    throw new Error(`scene [${data.sceneName}] not found`);
  }
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: scene.systemPrompt,
    },
  ];
  const stream = await getChatGptJsonLStream(messages,jsonlItem);
  
  const processing = await runTransaction(store, async (t) => {
    const documentData = await t.get(commandToResolve.ref);
    const data = documentData.data();
    if (!data) {
      throw new Error("data is null");
    }
    if (data.status !== "waiting") {
      return false
    }
    await t.update(commandToResolve.ref, {
        ...data,
        status: "processing",
        response: {
            original: "",
            responses: []
        }
    });
    return true;
  });
  if(!processing){
    return;
  }
  const reader = stream.getReader();
  const recursive = async () => {
    const {done,value} = await reader.read();
    if(done){
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
        const newResponses = [...data.response.responses]
        if(!value.parsed.type || value.parsed.type === "message"){
            newResponses.push({
                type: "text",
                content: value.parsed.content,
                visibility: value.parsed.visibility || "public"
            })
        }
        //TODO: change scene
        t.update(commandToResolve.ref, {
            ...data,
            response: {
                original: data.response.original + "\n" + value.original,
                responses: newResponses
            }
        });
    })
    await recursive();
  }
  recursive();
};
