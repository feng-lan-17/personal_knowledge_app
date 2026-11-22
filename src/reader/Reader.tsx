import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { COLUMN_NAME, SAMPLE_LABEL, formatEditionDate, newId } from "../domain/labels.ts"
import { extractToc } from "../domain/toc.ts"
import type { Article, Highlight, Note, ReadingState } from "../domain/types.ts"
import { Button } from "../components/ui/button.tsx"
import { Textarea } from "../components/ui/textarea.tsx"
import { useLibrary } from "../library/context.tsx"
import { AiPanel } from "./AiPanel.tsx"
import { HIGHLIGHT_LIMITS } from "./limits.ts"
import { MarkdownView } from "./MarkdownView.tsx"
import type { ArticlePage } from "../storage/repository.ts"

export function Reader({
  article,
  reading,
  highlights,
  notes,
  articles,
}: {
  article: ArticlePage
  reading: ReadingState
  highlights: Highlight[]
  notes: Note[]
  articles: Article[]
}) {
  const lib = useLibrary()
  const [tocOpen, setTocOpen] = useState(article.layout !== "immersive")
  const [aiOpen, setAiOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [selection, setSelection] = useState("")
  const [bar, setBar] = useState<{ x: number; y: number; quote: string; prefix: string; suffix: string } | null>(null)
  const [unplaced, setUnplaced] = useState<string[]>([])
  const [active, setActive] = useState("")
  const bodyRef = useRef<HTMLDivElement>(null)
  const toc = extractToc(article.body)
  const related = article.relatedIds
    .map((id) => articles.find((item) => item.id === id))
    .filter((item): item is Article => Boolean(item))

  useEffect(() => {
    const root = bodyRef.current
    if (!root) return
    const headings = [...root.querySelectorAll("h2, h3, h4")]
    if (!headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) setActive(visible.target.id)
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.2, 0.6] },
    )
    for (const heading of headings) observer.observe(heading)
    return () => observer.disconnect()
  }, [article.id, article.body])

  useEffect(() => {
    const onUp = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !bodyRef.current) return
      if (!sel.anchorNode || !bodyRef.current.contains(sel.anchorNode)) return
      const quote = sel.toString().replace(/\s+/g, " ").trim()
      if (quote.length < 2) return
      let prefix = ""
      let suffix = ""
      if (sel.anchorNode === sel.focusNode && sel.anchorNode.nodeType === Node.TEXT_NODE) {
        const text = sel.anchorNode.textContent ?? ""
        const start = Math.min(sel.anchorOffset, sel.focusOffset)
        const end = Math.max(sel.anchorOffset, sel.focusOffset)
        prefix = text.slice(Math.max(0, start - 24), start)
        suffix = text.slice(end, end + 24)
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      setSelection(quote)
      setBar({ x: Math.max(8, rect.left), y: Math.max(8, rect.top - 42), quote, prefix, suffix })
    }
    document.addEventListener("mouseup", onUp)
    return () => document.removeEventListener("mouseup", onUp)
  }, [article.id])

  async function saveReading(patch: Partial<ReadingState>) {
    await lib.store.saveReading({ ...reading, ...patch, id: article.id, articleId: article.id })
    lib.refresh()
  }

  async function addHighlight(quote: string, prefix: string, suffix: string) {
    await lib.store.saveHighlight({
      id: newId("hl"),
      articleId: article.id,
      quote,
      note: "",
      prefix,
      suffix,
      createdAt: new Date().toISOString(),
    })
    setBar(null)
    lib.refresh()
  }

  async function addNote(text: string) {
    const now = new Date().toISOString()
    await lib.store.saveNote({
      id: newId("note"),
      articleId: article.id,
      body: text,
      createdAt: now,
      updatedAt: now,
    })
    setDraft("")
    setNoteOpen(true)
    lib.refresh()
  }

  const tools = (
    <div className="toolbar-group">
      <Button aria-pressed={reading.isRead} onClick={() => void saveReading({ isRead: !reading.isRead })}>
        {reading.isRead ? "已读" : "标为已读"}
      </Button>
      <Button aria-pressed={reading.favorite} onClick={() => void saveReading({ favorite: !reading.favorite })}>
        {reading.favorite ? "已收藏" : "收藏"}
      </Button>
      <Button aria-pressed={noteOpen} onClick={() => setNoteOpen((open) => !open)}>
        笔记
      </Button>
      {article.layout !== "immersive" ? (
        <Button aria-pressed={tocOpen} onClick={() => setTocOpen((open) => !open)}>
          目录
        </Button>
      ) : null}
      <Button aria-pressed={aiOpen} onClick={() => setAiOpen((open) => !open)}>
        AI
      </Button>
      <Button
        onClick={() =>
          void lib.store.exportArticleMarkdown(article.id).then((markdown) => {
            const blob = new Blob([markdown], { type: "text/markdown" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `${article.id}.md`
            link.click()
            URL.revokeObjectURL(url)
          })
        }
      >
        导出
      </Button>
    </div>
  )

  const head = (
    <header className="article-head">
      <p className="kicker">
        {COLUMN_NAME[article.columnId]} · {SAMPLE_LABEL[article.sampleKind]}
      </p>
      <h1>{article.title}</h1>
      {article.subtitle ? <p className="deck">{article.subtitle}</p> : null}
      <p className="path">
        {article.path.join(" / ")} · {article.author} · 约 {article.readingMinutes} 分钟 · 编订于 {formatEditionDate(article.updatedAt)}
      </p>
      <p className="meta">{article.summary}</p>
      <p className="meta">适用：{article.applicableVersion}</p>
      <p className="meta">{article.copyright}</p>
      {article.sources.length ? (
        <ul className="sources">
          {article.sources.map((source) => (
            <li key={source.title}>
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              ) : (
                <b>{source.title}</b>
              )}
              <span>{source.note}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  )

  const noteBlock = noteOpen ? (
    <section className="notes">
      <h2>笔记</h2>
      <p className="meta">写在本地库里，和正文分开，替换教材不会带走它们。</p>
      <div className="stack">
        <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="写给自己的话" />
        <Button variant="solid" disabled={!draft.trim()} onClick={() => void addNote(draft.trim())}>
          保存笔记
        </Button>
      </div>
      {notes.map((note) => (
        <article key={note.id} className="note-card">
          <p>{note.body}</p>
          <Button
            className="btn-sm"
            onClick={() => {
              void lib.store.deleteNote(note.id).then(() => lib.refresh())
            }}
          >
            删除
          </Button>
        </article>
      ))}
    </section>
  ) : null

  const tocNav = tocOpen && toc.length ? (
    <nav className="toc" aria-label="章节目录">
      <p className="side-label">目录</p>
      <ol>
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              data-depth={item.depth}
              data-active={active === item.id}
              onClick={(event) => {
                event.preventDefault()
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                history.replaceState(null, "", `#${item.id}`)
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  ) : null

  const body = (
    <div ref={bodyRef}>
      <MarkdownView body={article.body} layout={article.layout} highlights={highlights} onPlaced={setUnplaced} />
    </div>
  )

  const unplacedNote =
    unplaced.length > 0 ? <p className="meta">有 {unplaced.length} 条摘录没能标回正文，仍可在「我的」里阅读。</p> : null

  const relatedBlock = related.length ? (
    <section className="section">
      <h2>相关</h2>
      <ul className="plain-list">
        {related.map((item) => (
          <li key={item.id}>
            <Link to={`/read/${item.id}`}>{item.title}</Link>
            <span className="meta"> · {COLUMN_NAME[item.columnId]}</span>
          </li>
        ))}
      </ul>
    </section>
  ) : null

  const limits = (
    <details className="quiet-tools">
      <summary>划线能做到哪里</summary>
      <ul>
        {HIGHLIGHT_LIMITS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </details>
  )

  return (
    <article className="page">
      <div className="reader-toolbar">
        <Link className="back-link" to={article.columnId === "inbox" ? "/library" : `/library/${article.columnId}`}>
          返回{COLUMN_NAME[article.columnId]}
        </Link>
        {article.layout === "immersive" ? null : tools}
      </div>
      {article.layout === "immersive" ? (
        <div className="essay-shell" data-testid="reader-essay-shell">
          <header className="article-head">
            <p className="kicker">
              {COLUMN_NAME[article.columnId]} · {SAMPLE_LABEL[article.sampleKind]}
            </p>
            <h1>{article.title}</h1>
            {article.subtitle ? <p className="deck">{article.subtitle}</p> : null}
            <p className="essay-byline">{article.author}</p>
          </header>
          <details className="quiet-tools">
            <summary>工具</summary>
            {tools}
          </details>
          {body}
          {unplacedNote}
          <details className="quiet-tools">
            <summary>背景与赏析</summary>
            <p>
              这篇是本库的原创示例，主题落在{article.path.join("、")}。它不是江南或史铁生的作品，也不替代他们的句子。作者生平、书名和合法入口在
              <Link to="/read/essay-authors">作者文库</Link>。{article.copyright}
            </p>
          </details>
          {limits}
          {noteBlock}
          {aiOpen ? <div style={{ marginTop: "1.2rem" }}><AiPanel ai={lib.ai} article={article} articles={articles} selection={selection} /></div> : null}
          {relatedBlock}
        </div>
      ) : (
        <div className="reader-grid" data-toc={tocOpen && toc.length ? "on" : "off"} data-ai={aiOpen ? "on" : "off"} data-testid="reader-technical">
          {tocNav}
          <div className="reader-main">
            {head}
            {body}
            {unplacedNote}
            {limits}
            {noteBlock}
            {relatedBlock}
          </div>
          {aiOpen ? <AiPanel ai={lib.ai} article={article} articles={articles} selection={selection} /> : null}
        </div>
      )}
      {bar ? (
        <div className="selection-bar" style={{ left: bar.x, top: bar.y }}>
          <button
            className="btn"
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void addHighlight(bar.quote, bar.prefix, bar.suffix)}
          >
            划线
          </button>
          <button
            className="btn"
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setDraft((current) => `${current}${current ? "\n\n" : ""}${bar.quote}`)
              setNoteOpen(true)
              setBar(null)
            }}
          >
            摘入笔记
          </button>
        </div>
      ) : null}
    </article>
  )
}
