import { openai } from "@/lib/openapi";
import { ChatCompletionRequestMessage } from "openai";
import { ZodSchema } from "zod";

export const getChatGptJsonResponse = async <T>(messages: ChatCompletionRequestMessage[],schema: ZodSchema<T>) => {
  const res = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0.3,
    frequency_penalty: 0.4
  });
  const content = res.data.choices[0].message?.content;
  if (!content) {
    throw new Error("error");
  }
  const parsed = JSON.parse(content);
  const parsedResponse = schema.parse(parsed);
  return parsedResponse;
};
