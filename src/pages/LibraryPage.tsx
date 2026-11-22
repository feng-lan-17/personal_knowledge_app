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
    <div className="page">
      <header className="search-hero">
        <p className="kicker">知识库</p>
        <h1>四栏目录</h1>
        <p className="deck">每栏是一小节可以读完的示例，不是知识图谱，也不是待办。</p>
      </header>
      {visible.map((column) => {
        const own = articles.filter((article) => article.columnId === column.id)
        return (
          <section className="section" key={column.id}>
            <p className="kicker">{column.kicker}</p>
            <h2>
              <Link to={`/library/${column.id}`}>{column.title}</Link>
            </h2>
            <p>{column.intro}</p>
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
  )
}
