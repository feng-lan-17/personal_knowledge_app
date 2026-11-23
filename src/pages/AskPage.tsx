import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { COLUMN_NAME } from "../domain/labels.ts"
import type { Article, SearchHit } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"

export function AskPage() {
  const lib = useLibrary()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<SearchHit[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [active, setActive] = useState(0)
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    document.title = "搜索 · 私人知识图书馆"
    void lib.store.listArticles().then(setArticles)
  }, [lib.store])

  useEffect(() => {
    const text = query.trim()
    if (!text) {
      setHits([])
      setAsked(false)
      return
    }
    const timer = window.setTimeout(() => {
      setAsked(true)
      void lib.store.search(text).then((next) => {
        setHits(next)
        setActive(0)
      })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [query, lib.store])

  const current = hits[active]
  const article = articles.find((item) => item.id === current?.articleId)

  return (
    <div className="page search-page">
      <header className="shelf-head"><h1>全文检索</h1></header>
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (current) navigate(`/read/${current.articleId}`)
        }}
      >
        <input
          value={query}
          placeholder="输入文章标题或正文关键词"
          aria-label="搜索文章"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault()
              setActive((index) => Math.min(index + 1, hits.length - 1))
            } else if (event.key === "ArrowUp") {
              event.preventDefault()
              setActive((index) => Math.max(index - 1, 0))
            }
          }}
        />
        <button
          className="btn btn-solid"
          type="button"
          onClick={() => {
            setAsked(true)
            setActive(0)
            void lib.store.search(query.trim()).then(setHits)
          }}
        >
          检索
        </button>
      </form>
      <p className="meta">在本地文章中检索。按回车打开当前条目。</p>
      <div className="search-split">
        <ul className="search-list">
          {hits.map((hit, index) => (
            <li key={hit.articleId}>
              <button type="button" className={index === active ? "is-active" : ""} onClick={() => setActive(index)} onDoubleClick={() => navigate(`/read/${hit.articleId}`)}>
                <strong>{hit.title}</strong>
                <span>{highlight(hit.snippet, query)}</span>
                <em>{COLUMN_NAME[hit.columnId]} · 文章 · {articles.find((item) => item.id === hit.articleId)?.applicableVersion ?? "未标版本"}</em>
              </button>
            </li>
          ))}
        </ul>
        {current && article ? (
          <aside className="search-preview">
            <p className="kicker">{COLUMN_NAME[article.columnId]}</p>
            <h2>{article.title}</h2>
            <p>{highlight(current.snippet, query)}</p>
            <Link to={`/read/${article.id}`}>打开正文</Link>
          </aside>
        ) : (
          <aside className="search-preview">
            <p>{asked ? "没有命中。" : "输入后在这里预览命中段落。"}</p>
          </aside>
        )}
      </div>
    </div>
  )
}

function highlight(text: string, query: string) {
  const needle = query.trim()
  const index = text.toLowerCase().indexOf(needle.toLowerCase())
  if (!needle || index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  )
}
