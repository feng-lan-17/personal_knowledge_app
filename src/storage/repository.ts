import { assertConfirmed, createBackup, parseBackup, type BackupBundle } from "../domain/backup.ts"
import { sha256 } from "../domain/hash.ts"
import { articleToMarkdown, parseMarkdownImport } from "../domain/markdown.ts"
import { readingMinutes } from "../domain/reading.ts"
import { searchDocuments } from "../domain/search.ts"
import {
  SCHEMA_VERSION,
  defaultPrefs,
  emptyReading,
  type AiDraft,
  type Article,
  type ArticleLayout,
  type Column,
  type ColumnId,
  type ContentNotice,
  type Discovery,
  type Highlight,
  type ImportResult,
  type Note,
  type PersonalTopic,
  type ReadingPrefs,
  type ReadingState,
  type RestoreReport,
  type SampleKind,
  type SearchHit,
  type SourceRef,
  type StoreInfo,
  type Topic,
} from "../domain/types.ts"
import { compareArticles, newId } from "../domain/labels.ts"
import type { PersonalSnapshot, TablePort } from "./port.ts"

export interface SeedArticleInput {
  id: string
  columnId: ColumnId
  layout: ArticleLayout
  title: string
  subtitle: string
  summary: string
  author: string
  primaryTopicId: string
  topicIds: string[]
  path: string[]
  relatedIds: string[]
  sources: SourceRef[]
  copyright: string
  updatedAt: string
  applicableVersion: string
  featured: boolean
  hero: boolean
  sampleKind: SampleKind
}

export interface SeedBundle {
  columns: Column[]
  topics: Topic[]
  discoveries: Discovery[]
  articles: SeedArticleInput[]
  bodies: Record<string, string>
}

export interface ArticlePage extends Article {
  body: string
}

export interface LibraryStore {
  info(): Promise<StoreInfo>
  listColumns(): Promise<Column[]>
  listTopics(columnId?: ColumnId): Promise<Topic[]>
  listArticles(filter?: { columnId?: ColumnId }): Promise<Article[]>
  getArticle(id: string): Promise<ArticlePage | null>
  search(query: string, filter?: { columnId?: string }): Promise<SearchHit[]>
  listDiscoveries(): Promise<Discovery[]>
  getReading(articleId: string): Promise<ReadingState>
  listReading(): Promise<ReadingState[]>
  saveReading(state: ReadingState): Promise<void>
  listHighlights(articleId?: string): Promise<Highlight[]>
  saveHighlight(highlight: Highlight): Promise<void>
  deleteHighlight(id: string): Promise<void>
  listNotes(articleId?: string): Promise<Note[]>
  saveNote(note: Note): Promise<void>
  deleteNote(id: string): Promise<void>
  listPersonalTopics(): Promise<PersonalTopic[]>
  savePersonalTopic(topic: PersonalTopic): Promise<void>
  deletePersonalTopic(id: string): Promise<void>
  listDrafts(): Promise<AiDraft[]>
  confirmDraft(draft: AiDraft): Promise<void>
  deleteDraft(id: string): Promise<void>
  getPrefs(): Promise<ReadingPrefs>
  setPrefs(prefs: ReadingPrefs): Promise<void>
  importMarkdown(raw: string, opts: { confirmed: boolean }): Promise<ImportResult>
  exportArticleMarkdown(id: string): Promise<string>
  exportBackup(): Promise<BackupBundle>
  restoreBackup(raw: unknown, opts: { confirmed: boolean }): Promise<RestoreReport>
  listContentNotices(): Promise<ContentNotice[]>
  replaceCanonicalBody(id: string, body: string, opts: { confirmed: boolean }): Promise<void>
  acceptPendingSeed(id: string, opts: { confirmed: boolean }): Promise<void>
  loadDivergedFile(id: string, opts: { confirmed: boolean }): Promise<void>
}

export interface DesktopBridge {
  afterInit(): Promise<void>
  loadDivergedFile(id: string): Promise<void>
}

export class LibraryRepository implements LibraryStore {
  private readonly port: TablePort
  private readonly storeInfo: StoreInfo
  private readonly bridge: DesktopBridge | null

  constructor(port: TablePort, storeInfo: StoreInfo, bridge?: DesktopBridge) {
    this.port = port
    this.storeInfo = storeInfo
    this.bridge = bridge ?? null
  }

  async init(seed: SeedBundle): Promise<void> {
    await this.port.setMeta("schema", String(SCHEMA_VERSION))
    for (const column of seed.columns) await this.port.put("columns", column)
    for (const topic of seed.topics) await this.port.put("topics", topic)
    for (const discovery of seed.discoveries) await this.port.put("discoveries", discovery)
    for (const input of seed.articles) {
      const body = seed.bodies[input.id]
      if (!body) throw new Error(`缺少正文：${input.id}`)
      await this.applySeedArticle(input, body)
    }
  }

  info(): Promise<StoreInfo> {
    return Promise.resolve(this.storeInfo)
  }

  async listColumns(): Promise<Column[]> {
    const columns = await this.port.all<Column>("columns")
    return columns.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async listTopics(columnId?: ColumnId): Promise<Topic[]> {
    const topics = await this.port.all<Topic>("topics")
    return topics
      .filter((topic) => !columnId || topic.columnId === columnId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async listArticles(filter?: { columnId?: ColumnId }): Promise<Article[]> {
    const articles = await this.port.all<Article>("articles")
    return articles
      .filter((article) => !filter?.columnId || article.columnId === filter.columnId)
      .sort(compareArticles)
  }

  async getArticle(id: string): Promise<ArticlePage | null> {
    const article = await this.port.get<Article>("articles", id)
    const document = await this.port.get<{ id: string; body: string }>("documents", id)
    if (!article || !document) return null
    return { ...article, body: document.body }
  }

  async search(query: string, filter?: { columnId?: string }): Promise<SearchHit[]> {
    const articles = await this.port.all<Article>("articles")
    const documents = await this.port.all<{ id: string; body: string }>("documents")
    const bodies = new Map(documents.map((item) => [item.id, item.body]))
    return searchDocuments(
      articles.map((article) => ({
        id: article.id,
        columnId: article.columnId,
        title: article.title,
        summary: article.summary,
        body: bodies.get(article.id) ?? "",
      })),
      query,
      filter,
    )
  }

  listDiscoveries(): Promise<Discovery[]> {
    return this.port.all<Discovery>("discoveries")
  }

  async getReading(articleId: string): Promise<ReadingState> {
    return (await this.port.get<ReadingState>("reading", articleId)) ?? emptyReading(articleId)
  }

  listReading(): Promise<ReadingState[]> {
    return this.port.all<ReadingState>("reading")
  }

  async saveReading(state: ReadingState): Promise<void> {
    await this.port.put("reading", { ...state, id: state.articleId, articleId: state.articleId })
  }

  async listHighlights(articleId?: string): Promise<Highlight[]> {
    const rows = await this.port.all<Highlight>("highlights")
    return rows
      .filter((row) => !articleId || row.articleId === articleId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async saveHighlight(highlight: Highlight): Promise<void> {
    if (!highlight.quote.trim()) throw new Error("空白选择没有写入。")
    await this.port.put("highlights", highlight)
  }

  async deleteHighlight(id: string): Promise<void> {
    await this.port.remove("highlights", id)
  }

  async listNotes(articleId?: string): Promise<Note[]> {
    const rows = await this.port.all<Note>("notes")
    return rows
      .filter((row) => !articleId || row.articleId === articleId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async saveNote(note: Note): Promise<void> {
    await this.port.put("notes", note)
  }

  async deleteNote(id: string): Promise<void> {
    await this.port.remove("notes", id)
  }

  async listPersonalTopics(): Promise<PersonalTopic[]> {
    const rows = await this.port.all<PersonalTopic>("personalTopics")
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async savePersonalTopic(topic: PersonalTopic): Promise<void> {
    await this.port.put("personalTopics", topic)
  }

  async deletePersonalTopic(id: string): Promise<void> {
    await this.port.remove("personalTopics", id)
  }

  async listDrafts(): Promise<AiDraft[]> {
    const rows = await this.port.all<AiDraft>("drafts")
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async confirmDraft(draft: AiDraft): Promise<void> {
    if (draft.confirmed !== true) throw new Error("未确认，已取消保存。数据没有改动。")
    if (!draft.body.trim()) throw new Error("草稿正文是空的，没有写入。")
    await this.port.put("drafts", { ...draft, confirmed: true })
  }

  async deleteDraft(id: string): Promise<void> {
    await this.port.remove("drafts", id)
  }

  async getPrefs(): Promise<ReadingPrefs> {
    const raw = await this.port.getMeta("prefs")
    if (!raw) return { ...defaultPrefs, modelSlot: { ...defaultPrefs.modelSlot } }
    const parsed = JSON.parse(raw) as ReadingPrefs
    return {
      ...defaultPrefs,
      ...parsed,
      modelSlot: { ...defaultPrefs.modelSlot, ...parsed.modelSlot },
    }
  }

  async setPrefs(prefs: ReadingPrefs): Promise<void> {
    await this.port.setMeta("prefs", JSON.stringify(prefs))
  }

  async importMarkdown(raw: string, opts: { confirmed: boolean }): Promise<ImportResult> {
    assertConfirmed(opts.confirmed, "导入")
    const parsed = parseMarkdownImport(raw)
    if (!parsed.ok) throw new Error(parsed.errors.join(" "))
    const id = newId("import")
    const hash = await sha256(parsed.draft.body)
    const article: Article = {
      id,
      columnId: parsed.draft.columnId,
      layer: "imported",
      layout: parsed.draft.layout,
      title: parsed.draft.title,
      subtitle: "",
      summary: parsed.draft.summary,
      author: parsed.draft.author,
      primaryTopicId: "inbox-root",
      topicIds: [],
      path: ["导入"],
      relatedIds: [],
      sources: [],
      copyright: parsed.draft.copyright,
      updatedAt: new Date().toISOString().slice(0, 10),
      applicableVersion: parsed.draft.applicableVersion,
      featured: false,
      hero: false,
      sampleKind: "imported",
      readingMinutes: readingMinutes(parsed.draft.body),
      origin: "import",
      seedHash: "",
      bodyHash: hash,
      userEdited: false,
      pendingSeed: false,
      fileDiverged: false,
    }
    await this.port.put("articles", article)
    await this.port.put("documents", { id, body: parsed.draft.body })
    return { articleId: id, title: article.title }
  }

  async exportArticleMarkdown(id: string): Promise<string> {
    const article = await this.getArticle(id)
    if (!article) throw new Error("没有这篇文章。")
    return articleToMarkdown(article)
  }

  async exportBackup(): Promise<BackupBundle> {
    const imported = (await this.listArticles()).filter((article) => article.layer === "imported")
    const importedArticles = []
    for (const article of imported) {
      const page = await this.getArticle(article.id)
      if (page) importedArticles.push({ article, body: page.body })
    }
    return createBackup({
      exportedAt: new Date().toISOString(),
      prefs: await this.getPrefs(),
      reading: await this.listReading(),
      highlights: await this.listHighlights(),
      notes: await this.listNotes(),
      personalTopics: await this.listPersonalTopics(),
      aiDrafts: await this.listDrafts(),
      importedArticles,
    })
  }

  async restoreBackup(raw: unknown, opts: { confirmed: boolean }): Promise<RestoreReport> {
    const parsed = parseBackup(raw)
    if (!parsed.ok) throw new Error(parsed.errors.join(" "))
    assertConfirmed(opts.confirmed, "恢复")
    const canonical = new Set(
      (await this.listArticles()).filter((article) => article.layer === "canonical").map((article) => article.id),
    )
    const skipped: string[] = []
    const imported: PersonalSnapshot["imported"] = []
    for (const item of parsed.bundle.importedArticles) {
      if (canonical.has(item.article.id) || item.article.layer === "canonical") {
        skipped.push(item.article.id)
        continue
      }
      imported.push({
        article: { ...item.article, layer: "imported", origin: "import" },
        body: item.body,
      })
    }
    const snapshot: PersonalSnapshot = {
      reading: parsed.bundle.reading,
      highlights: parsed.bundle.highlights,
      notes: parsed.bundle.notes,
      personalTopics: parsed.bundle.personalTopics,
      drafts: parsed.bundle.aiDrafts.filter((draft) => draft.confirmed),
      prefs: parsed.bundle.prefs,
      imported,
    }
    await this.port.replacePersonal(snapshot)
    return {
      reading: snapshot.reading.length,
      highlights: snapshot.highlights.length,
      notes: snapshot.notes.length,
      personalTopics: snapshot.personalTopics.length,
      aiDrafts: snapshot.drafts.length,
      imported: imported.length,
      skipped,
    }
  }

  async listContentNotices(): Promise<ContentNotice[]> {
    const articles = await this.listArticles()
    const notices: ContentNotice[] = []
    for (const article of articles) {
      if (article.pendingSeed) {
        notices.push({
          articleId: article.id,
          title: article.title,
          kind: "pending-seed",
          detail: "随程序带来的教材有新正文。笔记仍在。未经确认不会替换你正在读的版本。",
        })
      }
      if (article.fileDiverged) {
        notices.push({
          articleId: article.id,
          title: article.title,
          kind: "file-diverged",
          detail: "数据目录里的 Markdown 与库内正文不一致。库内正文和笔记都还保持原样。",
        })
      }
    }
    return notices
  }

  async replaceCanonicalBody(id: string, body: string, opts: { confirmed: boolean }): Promise<void> {
    assertConfirmed(opts.confirmed, "替换正文")
    const article = await this.port.get<Article>("articles", id)
    if (!article || article.layer !== "canonical") throw new Error("只能替换库内教材的正文。")
    const hash = await sha256(body)
    await this.port.put("documents", { id, body })
    await this.port.put("articles", {
      ...article,
      bodyHash: hash,
      userEdited: true,
      pendingSeed: false,
      readingMinutes: readingMinutes(body),
    })
    await this.port.remove("pendingBodies", id)
  }

  async acceptPendingSeed(id: string, opts: { confirmed: boolean }): Promise<void> {
    assertConfirmed(opts.confirmed, "替换正文")
    const pending = await this.port.get<{ id: string; body: string }>("pendingBodies", id)
    const article = await this.port.get<Article>("articles", id)
    if (!pending || !article) throw new Error("没有待确认的新正文。")
    const hash = await sha256(pending.body)
    await this.port.put("documents", { id, body: pending.body })
    await this.port.put("articles", {
      ...article,
      seedHash: hash,
      bodyHash: hash,
      userEdited: false,
      pendingSeed: false,
      readingMinutes: readingMinutes(pending.body),
    })
    await this.port.remove("pendingBodies", id)
  }

  async loadDivergedFile(id: string, opts: { confirmed: boolean }): Promise<void> {
    assertConfirmed(opts.confirmed, "从文件读入")
    if (!this.bridge) {
      throw new Error("浏览器预览没有磁盘上的 Markdown 目录。正文保存在 IndexedDB 的 documents 对象仓库里。")
    }
    await this.bridge.loadDivergedFile(id)
  }

  async finishDesktopInit(): Promise<void> {
    if (this.bridge) await this.bridge.afterInit()
  }

  private async applySeedArticle(input: SeedArticleInput, body: string) {
    const hash = await sha256(body)
    const existing = await this.port.get<Article>("articles", input.id)
    const base: Article = {
      ...input,
      layer: "canonical",
      origin: "seed",
      readingMinutes: readingMinutes(body),
      seedHash: hash,
      bodyHash: hash,
      userEdited: false,
      pendingSeed: false,
      fileDiverged: false,
    }
    if (!existing) {
      await this.port.put("articles", base)
      await this.port.put("documents", { id: input.id, body })
      return
    }
    if (existing.origin !== "seed") return
    if (!existing.userEdited) {
      await this.port.put("articles", { ...base, fileDiverged: existing.fileDiverged })
      if (existing.seedHash !== hash) await this.port.put("documents", { id: input.id, body })
      await this.port.remove("pendingBodies", input.id)
      return
    }
    if (existing.seedHash !== hash) {
      await this.port.put("articles", { ...existing, pendingSeed: true })
      await this.port.put("pendingBodies", { id: input.id, body })
    }
  }
}
