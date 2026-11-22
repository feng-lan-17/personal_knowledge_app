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
    <div className="page shelf" data-testid="llm-shelf">
      <header className="shelf-head">
        <p className="kicker">教材书架</p>
        <h1>大模型</h1>
        <p>两条路线可以来回走。百科单独放在旁边，词条先给一句解释和一个例子。</p>
      </header>
      <div className="route-board">
        <RouteCard
          title="认识与使用"
          article={articles.find((item) => item.id === "llm-dialogue")}
          topics={useRoute}
        />
        <RouteCard
          title="理解与构建"
          article={articles.find((item) => item.id === "llm-build")}
          topics={buildRoute}
        />
        <Link className="ency-entry" to="/library/llm/encyclopedia">
          <p className="kicker">百科</p>
          <strong>先看一句解释</strong>
          <span>{GLOSSARY.slice(0, 3).map((entry) => entry.term).join(" · ")}</span>
        </Link>
      </div>
    </div>
  )
}

function RouteCard({ title, article, topics }: { title: string; article?: Article; topics: Topic[] }) {
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
        {topics.map((topic) => (
          <li key={topic.id}>
            <Link to={article ? `/read/${article.id}` : "/library/llm"}>{topic.title}</Link>
            <span>{topic.summary}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
