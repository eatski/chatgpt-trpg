// type.ts
import { z } from "zod";
import { scene, scenario, assistantResponse, room, visibility, response, event } from "./schema";

export type Scene = z.infer<typeof scene>;
export type Scenario = z.infer<typeof scenario>;
export type AssistantResponse = z.infer<typeof assistantResponse>;
export type Response = z.infer<typeof response>;
export type Room = z.infer<typeof room>;
export type Visibility = z.infer<typeof visibility>;
export type Event = z.infer<typeof event>;
