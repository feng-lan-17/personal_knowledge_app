import { BackLink } from "../../components/BackLink.tsx"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { Article } from "../../domain/types.ts"
import { useLibrary } from "../../library/context.tsx"

export function EssayShelf() {
  const lib = useLibrary()
  const [articles, setArticles] = useState<(Article & { excerpt: string })[]>([])
  const [by, setBy] = useState<"picks" | "theme" | "author">("picks")
  const lead = articles.find((article) => article.id === "essay-rain") ?? articles[0]

  useEffect(() => {
    document.title = "散文 · 私人知识图书馆"
    let cancelled = false
    void lib.store.listArticles({ columnId: "essay" }).then(async (all) => {
      const rows = await Promise.all(all.filter((article) => article.layout === "immersive").map(async (article) => {
        const page = await lib.store.getArticle(article.id)
        const opening = page?.body.split(/\r?\n/).find((line) => line.trim() && !/^[#>]/.test(line.trim()))
        return { ...article, excerpt: opening?.trim().slice(0, 180) || article.summary }
      }))
      if (!cancelled) setArticles(rows)
    })
    return () => { cancelled = true }
  }, [lib.store, lib.tick])

  const groups = new Map<string, typeof articles>()
  for (const article of articles) {
    const key = by === "author" ? article.author : article.path.at(-1) || "其他"
    const group = groups.get(key)
    if (group) group.push(article)
    else groups.set(key, [article])
  }

  return (
    <div className="page shelf essay-shelf">
      <header className="essay-index-head">
        <h1>散文随笔</h1>
        <div className="catalog-switch" role="group" aria-label="作品分组">
          <button type="button" aria-pressed={by === "picks"} onClick={() => setBy("picks")}>选读</button>
          <button type="button" aria-pressed={by === "theme"} onClick={() => setBy("theme")}>按主题</button>
          <button type="button" aria-pressed={by === "author"} onClick={() => setBy("author")}>按作者</button>
        </div>
      </header>
      {by === "picks" && lead ? (
        <div className="essay-spread">
          <Link className="lead-story" to={"/read/" + lead.id}>
            {lead.id === "essay-rain" && <img src="/figures/rain-platform.webp" alt="" />}
            <small>{lead.path.at(-1)} · {lead.readingMinutes} 分钟</small>
            <h2>{lead.title}</h2>
            <p>{lead.excerpt}</p>
            <span className="essay-open">阅读全文 →</span>
          </Link>
          <div className="short-reads">
            {articles.filter((item) => item.id !== lead.id).map((item) => (
              <Link key={item.id} to={"/read/" + item.id}>
                <small>{item.path.at(-1)} · {item.readingMinutes} 分钟</small>
                <h2>{item.title}</h2>
                <p>{item.excerpt}</p>
                <span className="essay-open">阅读全文 →</span>
              </Link>
            ))}
            <Link className="author-index-link" to="/library/essay/authors"><small>作者书目</small><strong>江南与史铁生 ↗</strong></Link>
          </div>
        </div>
      ) : Array.from(groups, ([group, rows]) => (
        <section className="essay-group" key={group}>
          <h2>{group}</h2>
          <div>{rows.map((article) => (
            <Link className="essay-entry" key={article.id} to={"/read/" + article.id}>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
              <small>{by === "theme" ? article.author : article.path.at(-1)} · {article.readingMinutes} 分钟</small>
            </Link>
          ))}</div>
        </section>
      ))}
      {by !== "picks" && <aside className="essay-bibliography"><span>作者书目</span><Link to="/library/essay/authors">江南与史铁生 ↗</Link></aside>}
    </div>
  )
}

export function AuthorShelf() {
  useEffect(() => {
    document.title = "作者 · 私人知识图书馆"
  }, [])
  return (
    <div className="page shelf">
      <nav className="detail-route"><BackLink fallback="/library/essay" /></nav>
      <p className="kicker">作者页</p>
      <h1>江南与史铁生</h1>
      <p>这里只放书目和合法入口。可读的正文是本库的原创示例，授权情况用下面两句话说明。</p>
      <section>
        <h2>江南</h2>
        <p>公开简介里常见的记载：笔名江南，安徽合肥人。书名包括《此间的少年》《九州·缥缈录》《龙族》。</p>
        <p><a href="https://book.douban.com/subject/1020459/" target="_blank" rel="noreferrer">豆瓣书目《此间的少年》</a></p>
      </section>
      <section>
        <h2>史铁生</h2>
        <p>1951 年生于北京，2010 年去世。书名包括《我与地坛》《务虚笔记》《病隙碎笔》。</p>
        <p><a href="https://book.douban.com/subject/6079389/" target="_blank" rel="noreferrer">豆瓣书目《我与地坛》</a></p>
      </section>
      <p>本库原创散文可在程序内阅读。上面两位作者的作品正文版权归权利人，请购买或借阅正版。</p>
      <p><Link to="/read/essay-authors">书目整理全文</Link></p>
    </div>
  )
}
