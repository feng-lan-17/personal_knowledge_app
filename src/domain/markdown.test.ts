import { describe, expect, it } from "vitest"
import { articleToMarkdown, parseMarkdownImport } from "./markdown.ts"

describe("Markdown 导入", () => {
  it("读取前言和正文", () => {
    const parsed = parseMarkdownImport(`---
title: 一则导入
column: llm
summary: 摘要
author: 读者
layout: technical
applicableVersion: 无
copyright: 自有
---

正文第一段。
`)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.draft.title).toBe("一则导入")
      expect(parsed.draft.columnId).toBe("llm")
      expect(parsed.draft.body).toContain("正文第一段")
    }
  })

  it("没有标题或栏目不对时拒绝", () => {
    expect(parseMarkdownImport("只有一段没有标题").ok).toBe(false)
    expect(parseMarkdownImport("---\ntitle: 有标题\ncolumn: 未知\n---\n\n正文").ok).toBe(false)
    expect(parseMarkdownImport("   ").ok).toBe(false)
  })

  it("导出再导入仍能看到标题", () => {
    const markdown = articleToMarkdown({
      title: "导出篇",
      summary: "摘要",
      author: "读者",
      columnId: "csp",
      layout: "technical",
      applicableVersion: "C++17",
      copyright: "自有",
      sampleKind: "imported",
      updatedAt: "2026-11-22",
      body: "代码不在这里运行。",
    })
    const parsed = parseMarkdownImport(markdown)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.draft.title).toBe("导出篇")
  })
})
