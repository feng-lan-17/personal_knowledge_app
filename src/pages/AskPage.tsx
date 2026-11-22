import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { COLUMN_NAME } from "../domain/labels.ts"
import type { Article, SearchHit } from "../domain/types.ts"
import { Button } from "../components/ui/button.tsx"
import { Textarea } from "../components/ui/textarea.tsx"
import { useLibrary } from "../library/context.tsx"

export function AskPage() {
  const lib = useLibrary()
  const [params] = useSearchParams()
  const [question, setQuestion] = useState(params.get("q") ?? "")
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [notice, setNotice] = useState("")
  const status = lib.ai.status()

  useEffect(() => {
    document.title = "AI 搜索 · 私人知识图书馆"
    void lib.store.listArticles().then(setArticles)
  }, [lib.store])

  async function run(text: string) {
    const found = await lib.store.search(text)
    setHits(found)
    const result = await lib.ai.complete({
      question: text,
      contextArticleIds: found.map((hit) => hit.articleId),
    })
    setNotice(result.message)
  }

  return (
    <div className="page">
      <header className="search-hero">
        <p className="kicker">AI 搜索</p>
        <h1>在本地库里找</h1>
        <p className="deck">用一句自然语言检索已经在库里的文章。下面的命中是全文检索，不是模型写的回答。</p>
        <p className="status-line" data-testid="ask-disconnected">
          AI 服务：{status.headline}。{status.detail}
        </p>
      </header>
      <form
        className="stack"
        style={{ maxWidth: "42rem", marginTop: "1rem" }}
        onSubmit={(event) => {
          event.preventDefault()
          if (question.trim()) void run(question.trim())
        }}
      >
        <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：注意力怎样用到上下文" />
        <div className="row">
          <Button variant="solid" type="submit">
            检索本地资料
          </Button>
        </div>
      </form>
      {notice ? <p className="caution" style={{ marginTop: "1.2rem" }}>{notice}</p> : null}
      {hits ? (
        <section className="section">
          <h2>相关文章与来源</h2>
          <p className="meta">候选资料不在这份结果里，它们在发现页。</p>
          {hits.length === 0 ? <p>库内没有直接命中。</p> : null}
          {hits.map((hit) => {
            const article = articles.find((item) => item.id === hit.articleId)
            return (
              <article key={hit.articleId} className="hit">
                <p className="kicker">{COLUMN_NAME[hit.columnId]}</p>
                <Link to={`/read/${hit.articleId}`}>{hit.title}</Link>
                <p className="snippet">{hit.snippet}</p>
                {article?.sources.slice(0, 2).map((source) => (
                  <p key={source.title} className="meta">
                    来源：
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                    ) : (
                      source.title
                    )}
                  </p>
                ))}
              </article>
            )
          })}
        </section>
      ) : (
        <p className="meta" style={{ marginTop: "1rem" }}>
          还没有提问。
        </p>
      )}
    </div>
  )
}
