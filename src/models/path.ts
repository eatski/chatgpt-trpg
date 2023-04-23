import { room, scenario, interaction } from "./schema";
import { StorePathMap } from "./util";

export const storePathMap = {
  rooms: {
    document: room,
    collections: {
      chat: {
        document: interaction,
      },
    },
  },
  scenarios: {
    document: scenario,
  },
} as const satisfies StorePathMap;
