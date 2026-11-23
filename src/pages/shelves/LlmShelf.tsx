import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { GLOSSARY } from "../../content/glossary.ts"
import type { Article, Topic } from "../../domain/types.ts"
import { useLibrary } from "../../library/context.tsx"

export function LlmShelf() {
  const lib = useLibrary()
  const [articles, setArticles] = useState<Article[]>([])
  const [topics, setTopics] = useState<Topic[]>([])

  useEffect(() => {
    document.title = "大模型 · 私人知识图书馆"
    void Promise.all([lib.store.listArticles(), lib.store.listTopics("llm")]).then(([nextArticles, nextTopics]) => {
      setArticles(nextArticles.filter((article) => article.columnId === "llm"))
      setTopics(nextTopics)
    })
  }, [lib.store, lib.tick])

  const useRoute = topics.filter((topic) => topic.parentId === "llm-use")
  const buildRoute = topics.filter((topic) => topic.parentId === "llm-build")

  return (
    <div className="page shelf llm-shelf" data-testid="llm-shelf">
      <header className="shelf-head">
        <p className="kicker">教材书架</p>
        <h1>大模型</h1>
        <p>从日常使用到模型构建，选一条路线开始。</p>
      </header>
      <div className="route-board">
        <RouteCard
          title="认识与使用"
          article={articles.find((item) => item.id === "llm-dialogue")}
          topics={useRoute}
          articles={articles}
        />
        <RouteCard
          title="理解与构建"
          article={articles.find((item) => item.id === "llm-build")}
          topics={buildRoute}
          articles={articles}
        />
        <Link className="ency-entry" to="/library/llm/encyclopedia">
          <p className="kicker">百科</p>
          <strong>概念索引 ↗</strong>
          <span>{GLOSSARY.slice(0, 3).map((entry) => entry.term).join(" · ")}</span>
        </Link>
      </div>
      <section className="llm-glossary">
        <div className="section-heading"><h2>从概念入手</h2><Link to="/library/llm/encyclopedia">查看百科 ↗</Link></div>
        <ul className="plain-list">
          {GLOSSARY.slice(0, 3).map((entry) => (
            <li key={entry.id}>
              <Link to={`/library/llm/encyclopedia/${entry.id}`}>{entry.term}</Link>
              <p>{entry.gloss}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function RouteCard({ title, article, topics, articles }: { title: string; article?: Article; topics: Topic[]; articles: Article[] }) {
  const routeArticles = articles.filter((item) => item.id !== article?.id && topics.some((topic) => topic.id === item.primaryTopicId))
  return (
    <section className="route-card">
      <h2>{title}</h2>
      {article ? (
        <Link className="route-start" to={`/read/${article.id}`}>
          <span>从这里读起</span>
          <strong>{article.title}</strong>
        </Link>
      ) : null}
      <ul>
        {routeArticles.map((item) => (
          <li key={item.id}><Link to={`/read/${item.id}`}>{item.title}</Link></li>
        ))}
      </ul>
      <p className="meta">{topics.map((topic) => topic.title).join(" · ")}</p>
    </section>
  )
}
