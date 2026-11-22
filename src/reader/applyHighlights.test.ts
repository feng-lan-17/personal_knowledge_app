/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest"
import { applyHighlights } from "./applyHighlights.ts"

describe("正文回贴", () => {
  it("能在同一文本节点里标出摘录", () => {
    document.body.innerHTML = `<article><p>雨落在铁皮上，车还没有来。</p></article>`
    const root = document.querySelector("article") as HTMLElement
    const report = applyHighlights(root, [
      {
        id: "h1",
        articleId: "essay",
        quote: "铁皮上",
        note: "",
        prefix: "落在",
        suffix: "，车",
        createdAt: "2026-11-22",
      },
    ])
    expect(report[0]?.placed).toBe(true)
    expect(root.querySelector("mark")?.textContent).toBe("铁皮上")
  })

  it("跨不过去的句子不会假装已经划上", () => {
    document.body.innerHTML = `<article><p>只有这一句。</p></article>`
    const root = document.querySelector("article") as HTMLElement
    const report = applyHighlights(root, [
      {
        id: "h2",
        articleId: "essay",
        quote: "并不存在的长句",
        note: "",
        prefix: "",
        suffix: "",
        createdAt: "2026-11-22",
      },
    ])
    expect(report[0]?.placed).toBe(false)
    expect(root.querySelector("mark")).toBeNull()
  })
})
