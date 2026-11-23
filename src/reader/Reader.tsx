import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { COLUMN_NAME, newId } from "../domain/labels.ts"
import { extractToc } from "../domain/toc.ts"
import type { Article, Highlight, Note, ReadingState } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"
import { TermPopover } from "../pages/EncyclopediaPage.tsx"
import type { ArticlePage } from "../storage/repository.ts"
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog.tsx"
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
  const [tocOpen, setTocOpen] = useState(false)
  const chapterButton = useRef<HTMLButtonElement>(null)
  const chapterContainer = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!tocOpen) return
    function dismiss(event: PointerEvent) {
      if (!chapterContainer.current?.contains(event.target as Node)) setTocOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation()
        setTocOpen(false)
        chapterButton.current?.focus()
      }
    }
    document.addEventListener("pointerdown", dismiss)
    document.addEventListener("keydown", escape, true)
    return () => {
      document.removeEventListener("pointerdown", dismiss)
      document.removeEventListener("keydown", escape, true)
    }
  }, [tocOpen])
  const [aiOpen, setAiOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lookOpen, setLookOpen] = useState(false)
  const [selection, setSelection] = useState("")
  const [bar, setBar] = useState<{ x: number; y: number; quote: string; prefix: string; suffix: string } | null>(null)
  const [panelTab, setPanelTab] = useState<"read" | "note">("read")
  const [active, setActive] = useState("")
  const [activeId, setActiveId] = useState("")
  const panelTrigger = useRef<HTMLElement | null>(null)
  const readingRef = useRef(reading)
  readingRef.current = reading
  const [termId, setTermId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState("")
  const [saveState, setSaveState] = useState("")
  const [narrow, setNarrow] = useState(false)
  const toc = extractToc(article.body)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1180px)")
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
      const root = document.querySelector(".reader-column .prose")
      if (!sel?.anchorNode || sel.isCollapsed || !root || !root.contains(sel.anchorNode) || !root.contains(sel.focusNode)) {
        setBar(null)
        return
      }
      const quote = sel.toString().replace(/\s+/g, " ").trim()
      if (quote.length < 2) { setBar(null); return }
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
      setBar({ x: Math.max(8, Math.min(rect.left, window.innerWidth - 172)), y: Math.max(8, rect.top - 42), quote, prefix, suffix })
    }
    document.addEventListener("mouseup", onUp)
    const hide = () => setBar(null)
    window.addEventListener("scroll", hide, { passive: true })
    return () => {
      document.removeEventListener("mouseup", onUp)
      window.removeEventListener("scroll", hide)
    }
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

  function openPanel(tab: "read" | "note", trigger?: HTMLElement) {
    if (trigger) panelTrigger.current = trigger
    setPanelTab(tab)
    if (!aiOpen) preserveView(() => setAiOpen(true))
  }

  function closePanel() {
    preserveView(() => setAiOpen(false))
    panelTrigger.current?.focus({ preventScroll: true })
  }

  const aiMode = aiOpen ? (narrow ? "drawer" : "dock") : "off"
  const hasChapters = toc.length > 0
  const showToc = narrow && tocOpen && hasChapters
  const sideToc = !narrow && hasChapters
  const chapters = (
    <ol>
      {toc.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} data-depth={item.depth} data-active={activeId === item.id}
            aria-current={activeId === item.id ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault()
              jump(item.id)
              if (narrow) {
                setTocOpen(false)
                chapterButton.current?.focus({ preventScroll: true })
              }
            }}>{item.text}</a>
        </li>
      ))}
    </ol>
  )

  return (
    <article className="reader-page" data-layout={immersive ? "essay" : "technical"} onKeyDown={(event) => {
      if (event.key === "Escape" && aiOpen) closePanel()
    }}>
      <header className="reader-bar">
        <div className="reader-path">
          <Link to={article.columnId === "inbox" ? "/library" : `/library/${article.columnId}`}>← {COLUMN_NAME[article.columnId]}</Link>
          {narrow && hasChapters && <div className="chapter-anchor" ref={chapterContainer} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setTocOpen(false)
          }}>
            <button ref={chapterButton} type="button" className="chapter-button" aria-expanded={showToc} aria-controls="chapter-menu" onClick={() => setTocOpen(!tocOpen)}>章节目录 <span aria-hidden="true">⌄</span></button>
        {showToc ? (
          <nav className="chapter-menu" id="chapter-menu" aria-label="章节目录">
            <p className="side-label">文章目录</p>
            {chapters}
          </nav>
        ) : null}
          </div>}
        </div>
        {immersive ? (
          <div className="reader-actions">
            <button type="button" data-appearance aria-haspopup="dialog" aria-expanded={lookOpen} onClick={() => setLookOpen((value) => !value)}>外观</button>
            <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}>更多</button>
          </div>
        ) : (
          <div className="reader-actions">
            <button type="button" data-appearance aria-haspopup="dialog" aria-expanded={lookOpen} onClick={() => setLookOpen((value) => !value)}>外观</button>
            <button type="button" aria-pressed={reading.favorite} onClick={() => void saveReading({ favorite: !reading.favorite })}>
              {reading.favorite ? "已收藏" : "收藏"}
            </button>
            <button type="button" aria-pressed={aiOpen && panelTab === "note"} onClick={(event) => openPanel("note", event.currentTarget)}>笔记</button>
            <button type="button" className="ai-trigger" aria-pressed={aiOpen && panelTab === "read"} data-testid="open-ai" onClick={(event) => openPanel("read", event.currentTarget)}>AI 助读</button>
          </div>
        )}
      </header>
      {saveState && !(aiOpen && panelTab === "note") ? <p role="status" className="save-state" data-state={saveState}>{saveState}</p> : null}
      {lookOpen ? <Appearance onClose={() => setLookOpen(false)} /> : null}
      {moreOpen ? (
        <div className="more-menu">
          <button type="button" onClick={() => void saveReading({ favorite: !reading.favorite })}>{reading.favorite ? "取消收藏" : "收藏"}</button>
          <button type="button" onClick={() => openPanel("note")}>笔记</button>
          <button type="button" onClick={() => openPanel("read")}>AI 助读</button>
          <button type="button" onClick={() => void exportMarkdown(lib.store, article.id)}>导出</button>
        </div>
      ) : null}
      <div className="reader-stage" data-toc={sideToc ? "on" : "off"} data-ai={aiMode} data-testid={immersive ? "reader-essay-shell" : "reader-technical"}>
        {sideToc && <nav className="chapter-rail" aria-label="章节目录">
          <p>文章目录</p>
          {chapters}
        </nav>}
        <div className="reader-column">
          {immersive ? (
            <header className="essay-title">
              <h1>{article.title}</h1>
              <p>{article.author}</p>
            </header>
          ) : (
            <header className="tech-title">
              <p className="kicker">{COLUMN_NAME[article.columnId]} · {article.readingMinutes} 分钟</p>
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
            onClose={closePanel}
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
      {bar ? (
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
          <button type="button" className="btn" onMouseDown={(event) => event.preventDefault()} onClick={() => {
            setNoteDraft(bar.quote)
            openPanel("note")
            setBar(null)
          }}>摘入笔记</button>
        </div>
      ) : null}
    </article>
  )
}

function Appearance({ onClose }: { onClose: () => void }) {
  const lib = useLibrary()
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="appearance-dialog" aria-describedby={undefined} onCloseAutoFocus={(event) => {
        event.preventDefault()
        document.querySelector<HTMLButtonElement>(".reader-actions [data-appearance]")?.focus({ preventScroll: true })
      }}>
        <DialogTitle>阅读外观</DialogTitle>
        <fieldset><legend>底色</legend><div className="option-group">
          {(["paper", "night"] as const).map((theme) => <button key={theme} type="button" aria-pressed={lib.prefs.theme === theme} onClick={() => void lib.updatePrefs({ ...lib.prefs, theme })}>{theme === "paper" ? "日间" : "夜读"}</button>)}
        </div></fieldset>
        <fieldset><legend>字号</legend><div className="option-group">
          {[0.94, 1, 1.12].map((fontScale, index) => <button type="button" key={fontScale} aria-pressed={lib.prefs.fontScale === fontScale} onClick={() => void lib.updatePrefs({ ...lib.prefs, fontScale })}>{["小", "中", "大"][index]}</button>)}
        </div></fieldset>
        <p className="appearance-sample">翻到下一页，接着上次读到的地方。</p>
        <button className="btn btn-solid" type="button" onClick={onClose}>返回阅读</button>
      </DialogContent>
    </Dialog>
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
