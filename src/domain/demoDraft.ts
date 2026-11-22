import type { AiDraft } from "./types.ts"

/** 随程序附带的演示草稿。未确认前不写入个人库。 */
export const DEMO_DRAFT: AiDraft = {
  id: "demo-draft-attention",
  title: "演示草稿：并置阅读「一次对话」和「注意力」",
  demo: true,
  confirmed: false,
  basedOn: ["llm-dialogue", "llm-build"],
  createdAt: "2026-11-22T00:00:00.000Z",
  body: [
    "这是随程序附带的演示草稿，不是模型生成的文字，也没有引用外部回答。",
    "",
    "编辑时留下的读法只是一份提示：先读《大语言模型：从一次对话看懂它在做什么》的前半，把 token 和上下文当成使用时看得见的边界；再读《从注意力到一次训练》里缩放点积那一节，看同一个上下文在模型内部怎样被加权。",
    "",
    "确认之后，它才会进入你的个人草稿，并继续标为演示。不确认就不会写入。",
  ].join("\n"),
}
