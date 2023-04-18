import { z } from "zod"

export const scene =  z.object({
    systemPrompt: z.string().describe("システムに渡される、コンテキストとなるプロンプト"),
}).describe("シナリオの中に展開されるシーン")

export const scenario =  z.object({
    title: z.string().describe("タイトル"),
    description: z.string().describe("説明"),
    scenes: z.intersection(z.record(scene),z.object({default: scene})).describe("シナリオの中に展開されるシーン"),
}).describe("ゲームシナリオ")

export const userInput =  z.object({
    userId: z.string(),
    message: z.string(),
})

export const visibility = z.enum(["public", "private", "hidden"])

export const assistantResponse = z.object({
    tag: z.string(),
    inputHandling: z.optional(z.object({
        visibility,
    })),
    response: z.optional(z.object({
        content: z.string(),
        visibility,
    })),
    image: z.optional(z.object({
        promptToGenerate: z.optional(z.string()),
        visibility,
    })),
    changeScene: z.optional(z.string()),
})

export const room = z.object({
    createdAt: z.number(),
    scenario,
});