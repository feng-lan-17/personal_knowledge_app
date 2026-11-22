import { useState } from "react"
import { Link } from "react-router-dom"
import type { AiClient } from "../domain/ai.ts"
import type { Article } from "../domain/types.ts"
import { Button } from "../components/ui/button.tsx"
import { Textarea } from "../components/ui/textarea.tsx"

export function AiPanel({
  ai,
  article,
  articles,
  selection,
}: {
  ai: AiClient
  article: Article
  articles: Article[]
  selection: string
}) {
  const status = ai.status()
  const [extra, setExtra] = useState<string[]>([])
  const [question, setQuestion] = useState("")
  const [message, setMessage] = useState("")
  const others = articles.filter((item) => item.id !== article.id && item.layer === "canonical")

  async function ask(text: string, selected?: string) {
    const result = await ai.complete({
      question: text,
      contextArticleIds: [article.id, ...extra],
      selection: selected,
    })
    setMessage(result.message)
  }

  return (
    <aside className="ai-panel" data-testid="ai-panel">
      <h2>AI</h2>
      <p className="status-line" data-testid="ask-disconnected">
        {status.headline}
      </p>
      <p>{status.detail}</p>
      <p className="meta">默认上下文</p>
      <p>{article.title}</p>
      {extra.length ? (
        <ul className="plain-list">
          {extra.map((id) => (
            <li key={id}>{articles.find((item) => item.id === id)?.title ?? id}</li>
          ))}
        </ul>
      ) : null}
      <div className="stack" style={{ marginTop: "0.8rem" }}>
        <label>
          增加一篇已有文章
          <select
            className="field"
            value=""
            onChange={(event) => {
              const id = event.target.value
              if (id && !extra.includes(id)) setExtra([...extra, id])
            }}
          >
            <option value="">选择</option>
            {others.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="就这篇提问。未连接时不会生成回答。" />
        <div className="row">
          <Button variant="solid" disabled={!question.trim()} onClick={() => void ask(question)}>
            提问
          </Button>
          <Button disabled={!selection} onClick={() => void ask(selection ? `解释这段选文：${selection}` : "", selection)}>
            解释选文
          </Button>
        </div>
        {selection ? <p className="meta">当前选文：{selection.slice(0, 80)}</p> : <p className="meta">还没有选中正文。</p>}
        {message ? <p className="ai-result">{message}</p> : null}
        <Link to="/ask">改用本地全文检索</Link>
      </div>
    </aside>
  )
}
