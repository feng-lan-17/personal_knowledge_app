import "fake-indexeddb/auto"
import { describe, expect, it } from "vitest"
import { buildSeed } from "../content/seed.ts"
import { indexedDbInfo, openIdbPort } from "./indexeddb.ts"
import { LibraryRepository } from "./repository.ts"

describe("IndexedDB", () => {
  it("标明自己不是 SQLite，并在重新打开后保留收藏", async () => {
    expect(indexedDbInfo.engine).toBe("indexeddb")
    expect(indexedDbInfo.locationDetail).toContain("不是 localStorage")
    expect(indexedDbInfo.locationDetail).toContain("不是 SQLite")
    const name = "pkl-test-reopen"
    const first = new LibraryRepository(await openIdbPort(name), indexedDbInfo)
    await first.init(buildSeed())
    await first.saveReading({
      id: "llm-dialogue",
      articleId: "llm-dialogue",
      isRead: true,
      favorite: true,
      lastReadAt: "2026-11-22T03:00:00.000Z",
      scrollRatio: 0,
    })
    const second = new LibraryRepository(await openIdbPort(name), indexedDbInfo)
    await second.init(buildSeed())
    expect((await second.getReading("llm-dialogue")).favorite).toBe(true)
    expect((await second.getReading("llm-dialogue")).isRead).toBe(true)
    expect((await second.getArticle("llm-dialogue"))?.body).toContain("原创示例教材")
  })
})
