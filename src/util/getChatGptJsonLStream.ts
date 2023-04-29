import { openaiKey } from "@/lib/openapi";
import { ChatCompletionRequestMessage } from "openai";
import { ZodSchema } from "zod";

const parseChunkFormatString = (data: string) => {
  const regex = /data: (.*?)(?=data: |\n|$)/g;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonStrings: any[] = [];

  let match;
  while ((match = regex.exec(data)) !== null) {
    const jsonData = match[1];

    if (jsonData && jsonData !== "[DONE]") {
      const parsedData = JSON.parse(jsonData);
      jsonStrings.push(parsedData);
    }
  }
  return jsonStrings;
};

export const getChatGptJsonLStream = async <T>(messages: ChatCompletionRequestMessage[], schema: ZodSchema<T>) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    method: "POST",
    body: JSON.stringify({
      messages,
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      frequency_penalty: 0.4,
      stream: true,
    }),
  });
  const body = response.body;
  if (!body) {
    throw new Error(`error: ${response.statusText}`);
  }

  const reader = body.getReader();

  return new ReadableStream<{ parsed: T; original: string }>({
    start(controller) {
      let text = "";
      function push() {
        reader.read().then(({ done, value }) => {
          if (done) {
            if (text) {
              console.error("An unparsed string.", text);
            }
            controller.close();
            return;
          }
          const original = new TextDecoder().decode(value);
          const jsonarray = parseChunkFormatString(original);
          jsonarray.forEach((json) => {
            const content = json.choices[0]?.delta?.content;
            if (content) {
              text += content;
              try {
                const parsed = JSON.parse(text);
                const typed = schema.parse(parsed);
                console.log("json", parsed);
                controller.enqueue({
                  parsed: typed,
                  original: text,
                });
                text = "";
              } catch (e) {
                /* empty */
              }
            }
          });
          push();
        });
      }
      push();
    },
  });
};
