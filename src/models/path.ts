import { room, scenario, sessionEvent } from "./schema";
import { StorePathMap } from "./util";

export const storePathMap = {
  rooms: {
    document: room,
    collections: {
      events: {
        document: sessionEvent,
      },
    },
  },
  scenarios: {
    document: scenario,
  },
} as const satisfies StorePathMap;
