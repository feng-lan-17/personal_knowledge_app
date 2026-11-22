import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { Article } from "../../domain/types.ts"
import { useLibrary } from "../../library/context.tsx"

export function EssayShelf() {
  const lib = useLibrary()
  const [articles, setArticles] = useState<Article[]>([])
  const [by, setBy] = useState<"theme" | "author">("theme")

  useEffect(() => {
    document.title = "散文 · 私人知识图书馆"
    void lib.store.listArticles().then((all) => setArticles(all.filter((article) => article.columnId === "essay")))
  }, [lib.store, lib.tick])

  const feature = articles.find((article) => article.id === "essay-rain")
  const rest = articles.filter((article) => article.id !== "essay-rain")

  return (
    <div className="page shelf essay-shelf">
      <header className="essay-feature">
        <p className="kicker">这一期</p>
        {feature ? (
          <>
            <h1><Link to={`/read/${feature.id}`}>{feature.title}</Link></h1>
            <p className="by">{feature.author}</p>
            <p className="lede">{feature.subtitle}</p>
          </>
        ) : null}
      </header>
      <div className="catalog-switch">
        <button type="button" aria-pressed={by === "theme"} onClick={() => setBy("theme")}>按主题</button>
        <button type="button" aria-pressed={by === "author"} onClick={() => setBy("author")}>按作者</button>
      </div>
      {by === "theme" ? (
        <ul className="catalog">
          <li><span>故乡 / 时间</span><Link to="/read/essay-rain">雨落在旧车站的铁皮顶上</Link></li>
          <li><span>生命</span><Link to="/read/essay-lamp">灯还没有灭</Link></li>
          {rest.filter((article) => article.id === "essay-lamp").length === 0 ? null : null}
        </ul>
      ) : (
        <ul className="catalog">
          <li><span>本库</span><Link to="/read/essay-rain">雨落在旧车站的铁皮顶上</Link></li>
          <li><span>本库</span><Link to="/read/essay-lamp">灯还没有灭</Link></li>
          <li><span>书目</span><Link to="/library/essay/authors">江南、史铁生</Link></li>
        </ul>
      )}
      <p className="meta">两篇正文是原创示例，可以在这里读完。出版作品的全文不在本库。</p>
    </div>
  )
}

export function AuthorShelf() {
  useEffect(() => {
    document.title = "作者 · 私人知识图书馆"
  }, [])
  return (
    <div className="page shelf">
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
