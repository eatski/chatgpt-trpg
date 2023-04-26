import { openai } from "@/lib/openapi";
import { userCommandResponse } from "@/models/schema";
import { ChatCompletionRequestMessage } from "openai";

export const getChatGptAssistantResponse = async (messages: ChatCompletionRequestMessage[]) => {
  const res = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0.1,
  });
  const content = res.data.choices[0].message?.content;
  if (!content) {
    throw new Error("error");
  }
  const parsed = JSON.parse(content);
  const parsedResponse = userCommandResponse.parse(parsed);
  return parsedResponse;
};
