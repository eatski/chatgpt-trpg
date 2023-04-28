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

export const response = z.object({
  type: z.optional(z.literal("text")),
  content: z.string(),
  visibility,
});

export const room = z.object({
  createdAt: z.number(),
  scenario,
});

const queue = z.object({
  type: z.string(),
  createdAt: z.number(),
  status: z.enum(["waiting", "done", "failed","processing"]),
})

type Queue = z.infer<typeof queue>;

export const userCommandResponse = z.object({
  original: z.string(),
  responses: z.array(response),
  changeScene: z.optional(z.string()),
});

export const userCommand = z.intersection(
  z.object({
    type: z.literal("userCommand"),
    userId: z.string(),
    command: z.string(),
    createdAt: z.number(),
  }),
  z.union([
    z.object({
      status: z.literal("waiting"),
    }),
    z.object({
      status: z.literal("done"),
      response: userCommandResponse,
    }),
    z.object({
      status: z.literal("failed"),
      cause: z.string(),
    }),
    z.object({
      status: z.literal("processing"),
      response: userCommandResponse,
    })
  ]),
);

export const changeSceneResponse = z.object({
  original: z.string(),
  responses: z.array(response),
});

export const changeScene = z.intersection(
  z.object({
    type: z.literal("changeScene"),
    sceneName: z.string(),
    createdAt: z.number(),
  }),
  z.union([
    z.object({
      status: z.literal("waiting"),
    }),
    z.object({
      status: z.literal("done"),
      response: changeSceneResponse,
    }),
    z.object({
      status: z.literal("failed"),
      cause: z.string(),
    }),
    z.object({
      status: z.literal("processing"),
      response: changeSceneResponse,
    })
  ]),
);

export const sessionEvent = z.union([userCommand, changeScene]) satisfies Zod.Schema<Queue>;

export const jsonlItem = z.union([z.object({
  type: z.optional(z.literal("message")),
  content: z.string(),
  visibility: z.optional(visibility),
}),z.object({
  type: z.literal("command"),
  command: z.literal("changeScene"),
  sceneName: z.string(),
})
])
