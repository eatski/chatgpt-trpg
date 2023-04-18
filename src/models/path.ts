import { room, userInput, assistantResponse, scenario } from "./schema";
import { StorePathMap } from "./util";

export const storePathMap = {
  rooms: {
    document: room,
    collections: {
      inputs: {
        document: userInput,
      },
      responses: {
        document: assistantResponse,
      },
    },
  },
  scenarios: {
    document: scenario,
  },
} as const satisfies StorePathMap;
