import { describe, expect, it } from "vitest"
import { searchDocuments, type SearchDoc } from "./search.ts"

const docs: SearchDoc[] = [
  {
    id: "llm-build",
    columnId: "llm",
    title: "从注意力到一次训练",
    summary: "缩放点积与 softmax",
    body: "上下文里的注意力权重决定下一个 token。softmax 把分数变成权重。",
  },
  {
    id: "gs-basics",
    columnId: "gs",
    title: "三维高斯溅射",
    summary: "用椭球画场景",
    body: "协方差决定高斯被拉长的方向。",
  },
  {
    id: "essay-rain",
    columnId: "essay",
    title: "雨落在旧车站的铁皮顶上",
    summary: "一个下午",
    body: "故乡的雨落在铁皮屋顶上。",
  },
]

describe("全文检索", () => {
  it("中文短语命中相关文章", () => {
    const hits = searchDocuments(docs, "注意力")
    expect(hits[0]?.articleId).toBe("llm-build")
    expect(hits[0]?.snippet).toContain("注意力")
  })

  it("栏目过滤不会把其他学科混进来", () => {
    expect(searchDocuments(docs, "注意力", { columnId: "gs" })).toHaveLength(0)
    expect(searchDocuments(docs, "高斯").every((hit) => hit.columnId === "gs")).toBe(true)
  })

  it("自然句能靠其中的词命中", () => {
    const hits = searchDocuments(docs, "模型如何使用上下文")
    expect(hits.some((hit) => hit.articleId === "llm-build")).toBe(true)
    expect(hits.some((hit) => hit.articleId === "essay-rain")).toBe(false)
  })

  it("英文术语不区分大小写", () => {
    const hits = searchDocuments(docs, "Softmax")
    expect(hits[0]?.articleId).toBe("llm-build")
  })

  it("没有的词返回空", () => {
    expect(searchDocuments(docs, "zzqq不存在的冷门词")).toEqual([])
    expect(searchDocuments(docs, "  ")).toEqual([])
  })
})
