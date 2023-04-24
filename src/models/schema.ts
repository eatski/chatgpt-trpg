import { z } from "zod";

export const scene = z
  .object({
    systemPrompt: z.string().describe("システムに渡される、コンテキストとなるプロンプト"),
  })
  .describe("シナリオの中に展開されるシーン");

export const scenario = z
  .object({
    title: z.string().describe("タイトル"),
    description: z.string().describe("説明"),
    scenes: z.intersection(z.record(scene), z.object({ default: scene })).describe("シナリオの中に展開されるシーン"),
  })
  .describe("ゲームシナリオ");

export const visibility = z.enum(["public", "private", "hidden"]);

export const response = z.union([
  z.object({
    type: z.optional(z.literal("text")),
    content: z.string(),
    visibility,
  }),
  z.object({
    type: z.literal("image"),
    promptToGenerate: z.string(),
    visibility,
  }),
]);

export const assistantResponse = z.object({
  response: z.optional(response),
  responses: z.optional(z.array(response)),
  changeScene: z.optional(z.string()),
});

export const room = z.object({
  createdAt: z.number(),
  scenario,
});

export const event = z.object({
  type: z.literal("userCommand"),
  userId: z.string(),
  command: z.string(),
  response: z.optional(assistantResponse),
  createdAt: z.number(),
});
