import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DEMO_DRAFT } from "../domain/demoDraft.ts"
import { COLUMN_NAME } from "../domain/labels.ts"
import type { AiDraft, Article, Highlight, Note, PersonalTopic, ReadingState } from "../domain/types.ts"
import { Button } from "../components/ui/button.tsx"
import { Checkbox } from "../components/ui/checkbox.tsx"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../components/ui/dialog.tsx"
import { useLibrary } from "../library/context.tsx"
import { HIGHLIGHT_LIMITS } from "../reader/limits.ts"

export function MePage() {
  const lib = useLibrary()
  const [articles, setArticles] = useState<Article[]>([])
  const [reading, setReading] = useState<ReadingState[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [topics, setTopics] = useState<PersonalTopic[]>([])
  const [drafts, setDrafts] = useState<AiDraft[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [ack, setAck] = useState(false)

  useEffect(() => {
    document.title = "我的 · 私人知识图书馆"
    void Promise.all([
      lib.store.listArticles(),
      lib.store.listReading(),
      lib.store.listHighlights(),
      lib.store.listNotes(),
      lib.store.listPersonalTopics(),
      lib.store.listDrafts(),
    ]).then(([nextArticles, nextReading, nextHighlights, nextNotes, nextTopics, nextDrafts]) => {
      setArticles(nextArticles)
      setReading(nextReading)
      setHighlights(nextHighlights)
      setNotes(nextNotes)
      setTopics(nextTopics)
      setDrafts(nextDrafts)
    })
  }, [lib.store, lib.tick])

  const titleOf = (id: string) => articles.find((article) => article.id === id)?.title ?? "文章已不在库中"
  const read = reading.filter((item) => item.isRead)
  const favorites = reading.filter((item) => item.favorite)
  const savedDemo = drafts.find((draft) => draft.id === DEMO_DRAFT.id)

  return (
    <div className="page me-layout">
      <nav className="me-nav" aria-label="我的">
        <a href="#read">已读</a>
        <a href="#favorites">收藏</a>
        <a href="#highlights">划线与摘录</a>
        <a href="#notes">笔记</a>
        <a href="#topics">个人专题</a>
        <a href="#drafts">整理草稿</a>
      </nav>
      <div>
        <p className="kicker">我的</p>
        <h1 className="block-title">个人层</h1>
        <p className="deck">这些记录跟教材分开存放。清空浏览器站点数据会丢掉预览里的这一层；桌面版写在 SQLite 里。</p>

        <section className="block" id="read">
          <h2>已读</h2>
          {read.length === 0 ? <p className="meta">还没有标成已读的文章。打开文章后可以手动标记，系统不会替你算完成。</p> : null}
          <ul className="plain-list">
            {read.map((item) => (
              <li key={item.articleId}>
                <Link to={`/read/${item.articleId}`}>{titleOf(item.articleId)}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="block" id="favorites">
          <h2>收藏</h2>
          {favorites.length === 0 ? <p className="meta">还没有收藏。</p> : null}
          <ul className="plain-list">
            {favorites.map((item) => (
              <li key={item.articleId}>
                <Link to={`/read/${item.articleId}`}>{titleOf(item.articleId)}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="block" id="highlights">
          <h2>划线与摘录</h2>
          <ul>
            {HIGHLIGHT_LIMITS.map((line) => (
              <li key={line} className="meta">
                {line}
              </li>
            ))}
          </ul>
          {highlights.length === 0 ? <p className="meta">还没有划线。在正文里选中文字后可以保存。</p> : null}
          {highlights.map((item) => (
            <article key={item.id} className="note-card">
              <p>「{item.quote}」</p>
              <p className="meta">
                <Link to={`/read/${item.articleId}`}>{titleOf(item.articleId)}</Link>
                {articles.find((article) => article.id === item.articleId)
                  ? ` · ${COLUMN_NAME[articles.find((article) => article.id === item.articleId)!.columnId]}`
                  : ""}
              </p>
              <Button
                onClick={() => {
                  void lib.store.deleteHighlight(item.id).then(() => lib.refresh())
                }}
              >
                删除
              </Button>
            </article>
          ))}
        </section>

        <section className="block" id="notes">
          <h2>笔记</h2>
          {notes.length === 0 ? <p className="meta">还没有笔记。</p> : null}
          {notes.map((note) => (
            <article key={note.id} className="note-card">
              <p>{note.body}</p>
              <p className="meta">
                <Link to={`/read/${note.articleId}`}>{titleOf(note.articleId)}</Link>
              </p>
            </article>
          ))}
        </section>

        <section className="block" id="topics">
          <h2>个人专题</h2>
          <p className="meta">专题由摘录、引用和你自己的话组成。这一版不能在专题里插图。</p>
          <p>
            <Link to="/me/topics/new">新建专题</Link>
          </p>
          <ul className="plain-list">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link to={`/me/topics/${topic.id}`}>{topic.title}</Link>
                <span className="meta"> · {topic.blocks.length} 段</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="block" id="drafts">
          <h2>整理草稿</h2>
          <article className="note-card">
            <p className="kicker">演示 · 不是模型生成</p>
            <h3>{DEMO_DRAFT.title}</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{DEMO_DRAFT.body}</p>
            {savedDemo ? <p className="meta">已由你确认保存，演示标记仍在。</p> : <p className="meta">尚未写入个人库。</p>}
            {savedDemo ? null : (
              <Button
                onClick={() => {
                  setAck(false)
                  setConfirmOpen(true)
                }}
              >
                确认后保存
              </Button>
            )}
          </article>
          {drafts
            .filter((draft) => draft.id !== DEMO_DRAFT.id)
            .map((draft) => (
              <article key={draft.id} className="note-card">
                <h3>{draft.title}</h3>
                <p>{draft.body}</p>
              </article>
            ))}
        </section>
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>保存演示草稿</DialogTitle>
          <DialogDescription>
            这是随程序附带的演示草稿，不是模型生成的回答。只有确认后才会写入你的个人库，并继续标为演示。
          </DialogDescription>
          <label className="choice">
            <Checkbox checked={ack} onCheckedChange={(value) => setAck(value === true)} />
            我知道这不是 AI 的输出
          </label>
          <div className="row" style={{ marginTop: "1rem" }}>
            <Button
              variant="solid"
              disabled={!ack}
              onClick={() => {
                void lib.store.confirmDraft({ ...DEMO_DRAFT, confirmed: true }).then(() => {
                  setConfirmOpen(false)
                  lib.refresh()
                })
              }}
            >
              写入个人库
            </Button>
            <Button onClick={() => setConfirmOpen(false)}>取消</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
