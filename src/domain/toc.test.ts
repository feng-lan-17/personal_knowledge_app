import { describe, expect, it } from "vitest"
import { extractToc } from "./toc.ts"

describe("目录", () => {
  it("跳过代码块里的井号，并为中文标题生成锚点", () => {
    const toc = extractToc(`## 一次对话

说明。

\`\`\`
## 这不是标题
\`\`\`

## 一次对话

## 参考
`)
    expect(toc.map((item) => item.text)).toEqual(["一次对话", "一次对话", "参考"])
    expect(toc[0]?.id).toBe("一次对话")
    expect(toc[1]?.id).not.toBe(toc[0]?.id)
  })
})
