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
        <div className="seg" role="tablist">
          <button type="button" aria-selected={tab === "read"} onClick={() => onTab("read")}>AI 助读</button>
          <button type="button" aria-selected={tab === "note"} onClick={() => onTab("note")}>笔记</button>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭">关闭</button>
      </header>
      {tab === "read" ? (
        <>
          <div className="ai-scroll">
            <p className="status-line" data-testid="ask-disconnected">{status.headline}</p>
            <p>{status.detail}</p>
            <div className="chips">
              {useChapter ? <button type="button" onClick={() => setUseChapter(false)}>当前章节 ×</button> : null}
              {useSelection && selection ? <button type="button" onClick={() => setUseSelection(false)}>选中文字 ×</button> : null}
              {extra.map((id) => (
                <button key={id} type="button" onClick={() => setExtra(extra.filter((item) => item !== id))}>
                  {(articles.find((item) => item.id === id)?.title ?? id).slice(0, 12)} ×
                </button>
              ))}
            </div>
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
            {!status.connected ? (
              <p className="ai-links">
                <Link to="/settings">配置模型</Link>
                <Link to="/ask">本地搜索</Link>
              </p>
            ) : null}
          </div>
          <form
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
          </form>
        </>
      ) : (
        <div className="ai-scroll">
          <p className="save-state" data-state={saveState}>{saveState}</p>
          <Textarea value={noteDraft} onChange={(event) => onNoteDraft(event.target.value)} placeholder="写在这篇旁边的笔记" />
          <button type="button" className="btn btn-solid" onClick={onSaveNote} disabled={!noteDraft.trim()}>保存笔记</button>
          {notes.map((note) => (
            <article key={note.id} className="note-card"><p>{note.body}</p></article>
          ))}
        </div>
      )}
    </aside>
  )
}
