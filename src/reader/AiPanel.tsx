import { useState } from "react"
import { Link } from "react-router-dom"
import type { AiClient } from "../domain/ai.ts"
import type { Article, Note } from "../domain/types.ts"
import { Textarea } from "../components/ui/textarea.tsx"

interface Cite {
  id: string
  label: string
}

interface Message {
  id: string
  text: string
  cites: Cite[]
}

export function AiPanel({
  ai,
  article,
  articles,
  selection,
  chapterId,
  chapterLabel,
  notes,
  noteDraft,
  onNoteDraft,
  onSaveNote,
  saveState,
  onClose,
  onJump,
  tab,
  onTab,
}: {
  ai: AiClient
  article: Article
  articles: Article[]
  selection: string
  chapterId: string
  chapterLabel: string
  notes: Note[]
  noteDraft: string
  onNoteDraft: (value: string) => void
  onSaveNote: () => void
  saveState: string
  onClose: () => void
  onJump: (id: string) => void
  tab: "read" | "note"
  onTab: (tab: "read" | "note") => void
}) {
  const status = ai.status()
  const [extra, setExtra] = useState<string[]>([])
  const [useChapter, setUseChapter] = useState(true)
  const [useSelection, setUseSelection] = useState(Boolean(selection))
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const others = articles.filter((item) => item.id !== article.id && item.layer === "canonical")

  async function ask() {
    const text = question.trim()
    if (!text) return
    const result = await ai.complete({
      question: text,
      contextArticleIds: [article.id, ...extra],
      selection: useSelection ? selection : undefined,
    })
    const cites: Cite[] = []
    if (useChapter && chapterId) cites.push({ id: chapterId, label: chapterLabel || "当前章节" })
    setMessages((current) => [...current, { id: crypto.randomUUID(), text: result.message, cites }])
    setQuestion("")
  }

  return (
    <aside className="ai-dock" data-testid="ai-panel">
      <header className="ai-top">
        <h2 className="panel-heading">{tab === "note" ? "页边笔记" : "阅读助手"}</h2>
        <div className="seg" role="tablist">
          <button type="button" aria-selected={tab === "read"} onClick={() => onTab("read")}>AI 助读</button>
          <button type="button" aria-selected={tab === "note"} onClick={() => onTab("note")}>笔记</button>
        </div>
        <button className="panel-close" type="button" onClick={onClose} aria-label="关闭">×</button>
      </header>
      {tab === "read" ? (
        <>
          <div className="ai-scroll">
            <div className="assistant-context">
              <p className="status-line" data-testid="ask-disconnected">{status.connected ? status.headline : "模型未连接"}</p>
              <p>{status.connected ? status.detail : "模型未连接时，可以先查阅本篇引用的资料。"}</p>
              {!status.connected && article.sources.some((source) => source.url) && <section className="assist-sources">
                <h3>本篇参考资料</h3>
                {article.sources.filter((source) => source.url).map((source) => <a href={source.url} key={source.url + source.title} target="_blank" rel="noreferrer">{source.title}<span aria-hidden="true">↗</span></a>)}
              </section>}
              {!status.connected ? (
                <div className="ai-links">
                  <Link className="btn btn-solid" to="/ask">检索本地文章</Link>
                  <Link className="btn" to="/settings#model">模型设置</Link>
                </div>
              ) : null}
            </div>
            {status.connected ? <div className="chips">
              {useChapter ? <button type="button" onClick={() => setUseChapter(false)}>当前章节 ×</button> : null}
              {useSelection && selection ? <button type="button" onClick={() => setUseSelection(false)}>选中文字 ×</button> : null}
              {extra.map((id) => (
                <button key={id} type="button" onClick={() => setExtra(extra.filter((item) => item !== id))}>
                  {(articles.find((item) => item.id === id)?.title ?? id).slice(0, 12)} ×
                </button>
              ))}
            </div> : null}
            {messages.map((message) => (
              <article key={message.id} className="ai-msg">
                <p>{message.text}</p>
                {message.cites.map((cite, index) => (
                  <button key={cite.id} type="button" className="cite" onClick={() => onJump(cite.id)}>
                    {index + 1} {cite.label}
                  </button>
                ))}
              </article>
            ))}
          </div>
          {status.connected ? <form
            className="ai-compose"
            onSubmit={(event) => {
              event.preventDefault()
              void ask()
            }}
          >
            <select
              aria-label="附加文章"
              value=""
              onChange={(event) => {
                const id = event.target.value
                if (id && !extra.includes(id)) setExtra([...extra, id])
              }}
            >
              <option value="">附加文章</option>
              {others.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
            <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="就当前章节或选中文字提问" />
            <button type="submit" className="btn btn-solid" disabled={!question.trim()}>发送</button>
          </form> : null}
        </>
      ) : (
        <div className="ai-scroll notebook">
          <div className="note-sheet"><label htmlFor="reader-note">写下想法</label>
          <Textarea id="reader-note" value={noteDraft} onChange={(event) => onNoteDraft(event.target.value)} placeholder="写在这篇旁边的笔记" />
          <div className="note-footer"><span role="status" className="meta">{saveState}</span>
          <button type="button" className="btn btn-solid" onClick={onSaveNote} disabled={!noteDraft.trim() || saveState === "正在保存"}>保存笔记</button>
          </div>
          </div>
          {notes.length > 0 && <h3>本篇笔记 · {notes.length}</h3>}
          {notes.map((note) => (
            <article key={note.id} className="note-card"><time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleDateString("zh-CN")}</time><p>{note.body}</p></article>
          ))}
        </div>
      )}
    </aside>
  )
}
