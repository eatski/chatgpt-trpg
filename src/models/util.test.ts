import { test } from "vitest";
import { room, event, userCommandResponse, scenario } from "./schema";
import { ExtractZodSchema, StorePathMap } from "./util";

test("noop");

const storePathMap = {
  rooms: {
    document: room,
    collections: {
      inputs: {
        document: event,
      },
      responses: {
        document: userCommandResponse,
      },
    },
  },
  scenario: {
    document: scenario,
  },
} as const satisfies StorePathMap;

type MyStorePathMap = typeof storePathMap;

type RightExtendsLeft<L, R extends L> = R extends L ? true : false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Test1 = RightExtendsLeft<typeof event, ExtractZodSchema<MyStorePathMap, "rooms/hoge/inputs">>;
