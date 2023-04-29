import { Configuration, OpenAIApi } from "openai";
import { never } from "./util";

export const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? never("NEXT_PUBLIC_OPENAI_API_KEY is not defined");
const configuration = new Configuration({
  apiKey: openaiKey,
});
export const openai = new OpenAIApi(configuration);
