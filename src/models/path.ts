import { z } from "zod";
import { room, userInput, assistantResponse, scenario } from "./schema";
import { StorePathMap } from "./util";

export const storePathMap = {
  rooms: {
    document: room,
    collections: {
      chat: {
        document: z.object({
          user: userInput,
          assistant: z.optional(assistantResponse),
        }),
      },
    },
  },
  scenarios: {
    document: scenario,
  },
} as const satisfies StorePathMap;
