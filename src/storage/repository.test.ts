import { describe, expect, it } from "vitest"
import { DEMO_DRAFT } from "../domain/demoDraft.ts"
import { defaultPrefs, type Article, type Note } from "../domain/types.ts"
import { MemoryPort } from "./memory.ts"
import { LibraryRepository, type SeedBundle } from "./repository.ts"
import { indexedDbInfo } from "./indexeddb.ts"

function seed(): SeedBundle {
  return {
    columns: [
      { id: "llm", title: "大模型", kicker: "教材", summary: "摘要", intro: "介绍", sortOrder: 1 },
    ],
    topics: [],
    discoveries: [],
    articles: [
      {
        id: "a",
        columnId: "llm",
        layout: "technical",
        title: "注意力笔记",
        subtitle: "",
        summary: "讲注意力",
        author: "示例",
        primaryTopicId: "t",
        topicIds: [],
        path: [],
        relatedIds: [],
        sources: [],
        copyright: "示例",
        updatedAt: "2026-11-22",
        applicableVersion: "无",
        featured: true,
        hero: true,
        sampleKind: "original-sample",
      },
    ],
    bodies: { a: "注意力把上文加权。这是示例教材。" },
  }
}

async function openRepo() {
  const repo = new LibraryRepository(new MemoryPort(), indexedDbInfo)
  await repo.init(seed())
  return repo
}

describe("个人数据与教材边界", () => {
  it("收藏、已读和笔记会留下，检索能找到正文", async () => {
    const repo = await openRepo()
    await repo.saveReading({
      id: "a",
      articleId: "a",
      isRead: true,
      favorite: true,
      lastReadAt: "2026-11-22T01:00:00.000Z",
      scrollRatio: 0.2,
    })
    const note: Note = {
      id: "n1",
      articleId: "a",
      body: "我的笔记还在",
      createdAt: "2026-11-22T01:00:00.000Z",
      updatedAt: "2026-11-22T01:00:00.000Z",
    }
    await repo.saveNote(note)
    await repo.saveHighlight({
      id: "h1",
      articleId: "a",
      quote: "上文加权",
      note: "",
      prefix: "注意力把",
      suffix: "。这是",
      createdAt: "2026-11-22T01:00:00.000Z",
    })
    expect((await repo.getReading("a")).favorite).toBe(true)
    expect(await repo.listNotes("a")).toHaveLength(1)
    const hits = await repo.search("注意力")
    expect(hits[0]?.articleId).toBe("a")
  })

  it("未编辑的教材可以随种子更新，笔记不动", async () => {
    const repo = await openRepo()
    await repo.saveNote({
      id: "n1",
      articleId: "a",
      body: "不要覆盖我",
      createdAt: "2026-11-22T01:00:00.000Z",
      updatedAt: "2026-11-22T01:00:00.000Z",
    })
    const next = seed()
    next.bodies.a = "注意力的新正文。这是示例教材。"
    await repo.init(next)
    expect((await repo.getArticle("a"))?.body).toContain("新正文")
    expect((await repo.listNotes("a"))[0]?.body).toBe("不要覆盖我")
    expect(await repo.listArticles()).toHaveLength(1)
  })

  it("读者改过的正文不会被种子悄悄替换", async () => {
    const repo = await openRepo()
    await repo.saveNote({
      id: "n1",
      articleId: "a",
      body: "笔记",
      createdAt: "2026-11-22T01:00:00.000Z",
      updatedAt: "2026-11-22T01:00:00.000Z",
    })
    await repo.replaceCanonicalBody("a", "我改过的正文。", { confirmed: false }).catch(() => undefined)
    expect((await repo.getArticle("a"))?.body).toContain("上文加权")
    await repo.replaceCanonicalBody("a", "我改过的正文。", { confirmed: true })
    const next = seed()
    next.bodies.a = "种子里的更新。"
    await repo.init(next)
    expect((await repo.getArticle("a"))?.body).toBe("我改过的正文。")
    expect((await repo.getArticle("a"))?.pendingSeed).toBe(true)
    expect((await repo.listNotes("a"))[0]?.body).toBe("笔记")
    await repo.acceptPendingSeed("a", { confirmed: false }).catch(() => undefined)
    expect((await repo.getArticle("a"))?.body).toBe("我改过的正文。")
    await repo.acceptPendingSeed("a", { confirmed: true })
    expect((await repo.getArticle("a"))?.body).toBe("种子里的更新。")
    expect((await repo.listNotes("a"))[0]?.body).toBe("笔记")
  })

  it("恢复必须确认，且不会删除审定教材", async () => {
    const repo = await openRepo()
    await repo.saveNote({
      id: "keep",
      articleId: "a",
      body: "原笔记",
      createdAt: "2026-11-22T01:00:00.000Z",
      updatedAt: "2026-11-22T01:00:00.000Z",
    })
    const backup = await repo.exportBackup()
    backup.notes = [
      {
        id: "next",
        articleId: "a",
        body: "备份里的笔记",
        createdAt: "2026-11-22T02:00:00.000Z",
        updatedAt: "2026-11-22T02:00:00.000Z",
      },
    ]
    const canonical = (await repo.getArticle("a")) as Article
    backup.importedArticles.push({
      article: { ...canonical, id: "a", layer: "imported", origin: "import" },
      body: "试图覆盖教材",
    })
    await expect(repo.restoreBackup(backup, { confirmed: false })).rejects.toThrow(/未确认/)
    expect((await repo.listNotes())[0]?.body).toBe("原笔记")
    await expect(repo.restoreBackup({ app: "nope" }, { confirmed: true })).rejects.toThrow()
    expect((await repo.listNotes())[0]?.body).toBe("原笔记")
    const report = await repo.restoreBackup(backup, { confirmed: true })
    expect(report.skipped).toContain("a")
    expect((await repo.getArticle("a"))?.layer).toBe("canonical")
    expect((await repo.getArticle("a"))?.body).toContain("上文加权")
    expect((await repo.listNotes())[0]?.body).toBe("备份里的笔记")
  })

  it("导入必须确认，演示草稿未确认不写入", async () => {
    const repo = await openRepo()
    await expect(repo.importMarkdown("---\ntitle: 外来\ncolumn: inbox\n---\n\n正文", { confirmed: false })).rejects.toThrow(/未确认/)
    expect(await repo.listArticles({ columnId: "inbox" })).toHaveLength(0)
    const imported = await repo.importMarkdown("---\ntitle: 外来\ncolumn: inbox\n---\n\n正文示例", { confirmed: true })
    expect(imported.title).toBe("外来")
    await expect(repo.confirmDraft(DEMO_DRAFT)).rejects.toThrow(/未确认/)
    expect(await repo.listDrafts()).toHaveLength(0)
    await repo.confirmDraft({ ...DEMO_DRAFT, confirmed: true })
    const drafts = await repo.listDrafts()
    expect(drafts[0]?.demo).toBe(true)
    expect(drafts[0]?.confirmed).toBe(true)
    expect((await repo.getPrefs()).theme).toBe(defaultPrefs.theme)
  })

  it("浏览器没有磁盘正文目录", async () => {
    const repo = await openRepo()
    await expect(repo.loadDivergedFile("a", { confirmed: true })).rejects.toThrow(/IndexedDB/)
  })
})
