// type.ts
import { z } from "zod";
import { scene, scenario, userInput, assistantResponse, room, visibility } from "./schema";

export type Scene = z.infer<typeof scene>;
export type Scenario = z.infer<typeof scenario>;
export type UserInput = z.infer<typeof userInput>;
export type AssistantResponse = z.infer<typeof assistantResponse>;
export type Room = z.infer<typeof room>;
export type Visibility = z.infer<typeof visibility>;
