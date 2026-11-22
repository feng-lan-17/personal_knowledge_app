import { describe, expect, it } from "vitest"
import { buildSeed } from "./seed.ts"

describe("示例内容", () => {
  it("四栏各有两到三篇，并标明示例", () => {
    const seed = buildSeed()
    for (const columnId of ["llm", "essay", "csp", "gs"] as const) {
      const articles = seed.articles.filter((article) => article.columnId === columnId)
      expect(articles.length).toBeGreaterThanOrEqual(2)
      expect(articles.length).toBeLessThanOrEqual(3)
      for (const article of articles) {
        expect(article.sampleKind).not.toBe("imported")
        expect(seed.bodies[article.id]?.length).toBeGreaterThan(200)
      }
    }
  })

  it("散文不收录两位作者的代表性原文，前沿条目标明待核验", () => {
    const seed = buildSeed()
    const authors = seed.bodies["essay-authors"] ?? ""
    expect(authors).toContain("不含")
    expect(authors).not.toContain("废弃的古园")
    expect(seed.bodies["essay-rain"]).toContain("原创示例")
    expect(seed.articles.find((article) => article.id === "essay-rain")?.author).not.toContain("史铁生")
    expect(seed.bodies["gs-frontier"]).toContain("时效待核验")
    expect(seed.bodies["csp-search"]).toContain("luogu.com.cn")
    expect(seed.bodies["llm-build"]).toContain("$$")
    expect(seed.discoveries.every((item) => item.caution.length > 0)).toBe(true)
    expect(seed.articles.some((article) => article.hero)).toBe(true)
  })
})
