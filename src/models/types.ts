// type.ts
import { z } from "zod";
import {
  scene,
  scenario,
  userCommandResponse,
  room,
  visibility,
  response,
  sessionEvent,
  userCommand,
  changeScene,
  jsonlItem,
} from "./schema";

export type Scene = z.infer<typeof scene>;
export type Scenario = z.infer<typeof scenario>;
export type AssistantResponse = z.infer<typeof userCommandResponse>;
export type Response = z.infer<typeof response>;
export type Room = z.infer<typeof room>;
export type Visibility = z.infer<typeof visibility>;
export type SessionEvent = z.infer<typeof sessionEvent>;
export type SessionEventDone = SessionEvent & { status: "done" };
export type UserCommand = z.infer<typeof userCommand>;
export type ChangeScene = z.infer<typeof changeScene>;
export type JsonlItem = z.infer<typeof jsonlItem>;