import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { COLUMN_NAME, newId } from "../domain/labels.ts"
import { extractToc } from "../domain/toc.ts"
import type { Article, Highlight, Note, ReadingState } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"
import { TermPopover } from "../pages/EncyclopediaPage.tsx"
import type { ArticlePage } from "../storage/repository.ts"
import { AiPanel } from "./AiPanel.tsx"
import { MarkdownView } from "./MarkdownView.tsx"
import { preserveView } from "./preserve.ts"

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
  const location = useLocation()
  const immersive = article.layout === "immersive"
  const [tocOpen, setTocOpen] = useState(!immersive)
  const [aiOpen, setAiOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lookOpen, setLookOpen] = useState(false)
  const [selection, setSelection] = useState("")
  const [bar, setBar] = useState<{ x: number; y: number; quote: string; prefix: string; suffix: string } | null>(null)
  const [panelTab, setPanelTab] = useState<"read" | "note">("read")
  const [active, setActive] = useState("")
  const [activeId, setActiveId] = useState("")
  const readingRef = useRef(reading)
  readingRef.current = reading
  const [termId, setTermId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState("")
  const [saveState, setSaveState] = useState("")
  const [narrow, setNarrow] = useState(false)
  const toc = extractToc(article.body)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)")
    const apply = () => {
      setNarrow(media.matches)
      if (media.matches) setTocOpen(false)
    }
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [article.id])

  useEffect(() => {
    const headings = [...document.querySelectorAll(".reader-column h2, .reader-column h3")]
    if (!headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible?.target.id) return
        setActiveId(visible.target.id)
        setActive(visible.target.textContent ?? "")
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: [0.3, 0.7] },
    )
    for (const heading of headings) observer.observe(heading)
    return () => observer.disconnect()
  }, [article.id, article.body])

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => {
      void lib.store.saveReading({ ...readingRef.current, anchor: active, id: article.id, articleId: article.id })
    }, 600)
    return () => window.clearTimeout(timer)
    // 只在章节变化时记下位置，避免保存本身把 effect 再触发一遍。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, article.id, lib.store])

  useEffect(() => {
    const onUp = () => {
      const sel = window.getSelection()
      const root = document.querySelector(".reader-column")
      if (!sel || sel.isCollapsed || !root || !sel.anchorNode || !root.contains(sel.anchorNode)) return
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
    setSaveState("正在保存")
    try {
      await lib.store.saveReading({ ...reading, ...patch, id: article.id, articleId: article.id })
      setSaveState("已保存")
      lib.refresh()
    } catch {
      setSaveState("保存失败")
    }
  }

  function jump(id: string) {
    const node = document.getElementById(id)
    if (!node) return
    node.scrollIntoView({ block: "center" })
    node.classList.add("cite-flash")
    window.setTimeout(() => node.classList.remove("cite-flash"), 1200)
  }

  const aiMode = aiOpen ? (narrow ? "drawer" : "dock") : "off"
  const showToc = tocOpen && !immersive && toc.length > 0

  return (
    <article className="reader-page">
      <header className="reader-bar">
        <div className="reader-path">
          <Link to={article.columnId === "inbox" ? "/library" : `/library/${article.columnId}`}>返回</Link>
          <span>{article.path.join(" / ") || COLUMN_NAME[article.columnId]}</span>
        </div>
        {immersive ? (
          <div className="reader-actions">
            <button type="button" aria-pressed={lookOpen} onClick={() => setLookOpen((value) => !value)}>外观</button>
            <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}>更多</button>
          </div>
        ) : (
          <div className="reader-actions">
            <button type="button" aria-pressed={showToc} onClick={() => preserveView(() => setTocOpen((value) => !value))}>目录</button>
            <button type="button" aria-pressed={lookOpen} onClick={() => setLookOpen((value) => !value)}>外观</button>
            <button type="button" aria-pressed={reading.favorite} onClick={() => void saveReading({ favorite: !reading.favorite })}>
              {reading.favorite ? "已收藏" : "收藏"}
            </button>
            <button type="button" aria-pressed={aiOpen && panelTab === "note"} onClick={() => { setPanelTab("note"); preserveView(() => setAiOpen(true)) }}>笔记</button>
            <button type="button" aria-pressed={aiOpen && panelTab === "read"} data-testid="open-ai" onClick={() => { setPanelTab("read"); preserveView(() => setAiOpen(true)) }}>AI</button>
          </div>
        )}
      </header>
      {saveState ? <p className="save-state" data-state={saveState}>{saveState}</p> : null}
      {lookOpen ? <Appearance onClose={() => setLookOpen(false)} /> : null}
      {moreOpen ? (
        <div className="more-menu">
          <button type="button" onClick={() => void saveReading({ favorite: !reading.favorite })}>{reading.favorite ? "取消收藏" : "收藏"}</button>
          <button type="button" onClick={() => { setPanelTab("note"); setAiOpen(true); setMoreOpen(false) }}>笔记</button>
          <button type="button" onClick={() => void exportMarkdown(lib.store, article.id)}>导出</button>
        </div>
      ) : null}
      <div className="reader-stage" data-toc={showToc ? "on" : "off"} data-ai={aiMode} data-testid={immersive ? "reader-essay-shell" : "reader-technical"}>
        {showToc ? (
          <nav className="toc" aria-label="章节目录">
            <ol>
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} data-depth={item.depth} data-active={activeId === item.id} onClick={(event) => { event.preventDefault(); jump(item.id) }}>
                    {item.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className="reader-column">
          {immersive ? (
            <header className="essay-title">
              <h1>{article.title}</h1>
              <p>{article.author}</p>
            </header>
          ) : (
            <header className="tech-title">
              <h1>{article.title}</h1>
              <p className="lede">{article.summary}</p>
            </header>
          )}
          <MarkdownView
            body={article.body}
            layout={article.layout}
            highlights={highlights}
            onTerm={(id) => setTermId(id)}
          />
          {immersive ? (
            <details className="quiet-tools">
              <summary>背景与授权</summary>
              <p>原创示例，可以在这里读完。江南与史铁生的作品全文不在本库，书目在<Link to="/library/essay/authors">作者页</Link>。</p>
            </details>
          ) : (
            <details className="quiet-tools">
              <summary>来源与版本</summary>
              <p>{article.applicableVersion}</p>
              <p>{article.copyright}</p>
              <ul>
                {article.sources.map((source) => (
                  <li key={source.title}>
                    {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : source.title}
                    <span> {source.note}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {termId ? <TermPopover termId={termId} from={`${location.pathname}${location.hash}`} onClose={() => setTermId(null)} /> : null}
        </div>
        {aiOpen ? (
          <AiPanel
            ai={lib.ai}
            article={article}
            articles={articles}
            selection={selection}
            chapterId={activeId}
            chapterLabel={active}
            notes={notes}
            noteDraft={noteDraft}
            onNoteDraft={setNoteDraft}
            saveState={saveState}
            onClose={() => preserveView(() => setAiOpen(false))}
            onJump={jump}
            tab={panelTab}
            onTab={setPanelTab}
            onSaveNote={() => {
              void (async () => {
                setSaveState("正在保存")
                try {
                  const now = new Date().toISOString()
                  await lib.store.saveNote({ id: newId("note"), articleId: article.id, body: noteDraft.trim(), createdAt: now, updatedAt: now })
                  setNoteDraft("")
                  setSaveState("已保存")
                  lib.refresh()
                } catch {
                  setSaveState("保存失败")
                }
              })()
            }}
          />
        ) : null}
      </div>
      {bar && (immersive ? true : true) ? (
        <div className="selection-bar" style={{ left: bar.x, top: bar.y }}>
          <button type="button" className="btn" onMouseDown={(event) => event.preventDefault()} onClick={() => {
            void (async () => {
              setSaveState("正在保存")
              try {
                await lib.store.saveHighlight({ id: newId("hl"), articleId: article.id, quote: bar.quote, note: "", prefix: bar.prefix, suffix: bar.suffix, createdAt: new Date().toISOString() })
                setSaveState("已保存")
                setBar(null)
                lib.refresh()
              } catch {
                setSaveState("保存失败")
              }
            })()
          }}>划线</button>
          {!immersive || selection ? (
            <button type="button" className="btn" onMouseDown={(event) => event.preventDefault()} onClick={() => { setNoteDraft(bar.quote); setAiOpen(true); setBar(null) }}>摘入笔记</button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function Appearance({ onClose }: { onClose: () => void }) {
  const lib = useLibrary()
  return (
    <div className="look-menu">
      <button type="button" aria-pressed={lib.prefs.theme === "paper"} onClick={() => void lib.updatePrefs({ ...lib.prefs, theme: "paper" })}>纸色</button>
      <button type="button" aria-pressed={lib.prefs.theme === "night"} onClick={() => void lib.updatePrefs({ ...lib.prefs, theme: "night" })}>夜读</button>
      <button type="button" onClick={() => void lib.updatePrefs({ ...lib.prefs, fontScale: 0.94 })}>小</button>
      <button type="button" onClick={() => void lib.updatePrefs({ ...lib.prefs, fontScale: 1 })}>中</button>
      <button type="button" onClick={() => void lib.updatePrefs({ ...lib.prefs, fontScale: 1.12 })}>大</button>
      <button type="button" onClick={onClose}>收起</button>
    </div>
  )
}

async function exportMarkdown(store: { exportArticleMarkdown: (id: string) => Promise<string> }, id: string) {
  const markdown = await store.exportArticleMarkdown(id)
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `${id}.md`
  link.click()
  URL.revokeObjectURL(url)
}
