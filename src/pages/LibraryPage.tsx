import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { SAMPLE_LABEL } from "../domain/labels.ts"
import type { Article, Column } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"

export function LibraryPage() {
  const lib = useLibrary()
  const [columns, setColumns] = useState<Column[]>([])
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    document.title = "知识库 · 私人知识图书馆"
    void Promise.all([lib.store.listColumns(), lib.store.listArticles()]).then(([nextColumns, nextArticles]) => {
      setColumns(nextColumns)
      setArticles(nextArticles)
    })
  }, [lib.store, lib.tick])

  const visible = columns.filter((column) => column.id !== "inbox" || articles.some((article) => article.columnId === "inbox"))

  return (
    <div className="page library-page">
      <header className="shelf-head">
        <h1>知识库</h1>
        <p>按领域浏览文章、教材与手册。</p>
      </header>
      <div className="library-grid">
      {visible.map((column) => {
        const own = articles.filter((article) => article.columnId === column.id)
        return (
          <section className="library-card" data-shelf={column.id} key={column.id}>
            <p className="kicker">{column.kicker}</p>
            <h2>
              {column.id === "inbox" ? column.title : <Link to={`/library/${column.id}`}>{column.title} <span aria-hidden="true">↗</span></Link>}
            </h2>
            <p>{column.summary}</p>
            <ul className="plain-list">
              {own.map((article) => (
                <li key={article.id}>
                  <Link to={`/read/${article.id}`}>{article.title}</Link>
                  <span className="meta"> · {SAMPLE_LABEL[article.sampleKind]}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      </div>
    </div>
  )
}
