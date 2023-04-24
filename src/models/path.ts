import { room, scenario, event } from "./schema";
import { StorePathMap } from "./util";

export const storePathMap = {
  rooms: {
    document: room,
    collections: {
      events: {
        document: event,
      },
    },
  },
  scenarios: {
    document: scenario,
  },
} as const satisfies StorePathMap;
