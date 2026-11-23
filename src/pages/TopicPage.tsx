import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { newId } from "../domain/labels.ts"
import type { Highlight, PersonalBlock, PersonalTopic } from "../domain/types.ts"
import { Button } from "../components/ui/button.tsx"
import { Input } from "../components/ui/input.tsx"
import { Textarea } from "../components/ui/textarea.tsx"
import { useLibrary } from "../library/context.tsx"

export function TopicPage() {
  const { id = "new" } = useParams()
  const navigate = useNavigate()
  const lib = useLibrary()
  const [topic, setTopic] = useState<PersonalTopic | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [message, setMessage] = useState("未保存")

  useEffect(() => {
    document.title = "个人专题 · 私人知识图书馆"
    void (async () => {
      const [topics, marks] = await Promise.all([lib.store.listPersonalTopics(), lib.store.listHighlights()])
      setHighlights(marks)
      if (id === "new") {
        setTopic({
          id: newId("topic"),
          title: "未命名专题",
          description: "",
          blocks: [],
          updatedAt: new Date().toISOString(),
        })
        return
      }
      setTopic(topics.find((item) => item.id === id) ?? null)
    })()
  }, [id, lib.store])

  if (!topic) return <p className="gate">{id === "new" ? "正在准备专题…" : "没有这个专题。"}</p>

  function update(patch: Partial<PersonalTopic>) {
    setTopic((current) => (current ? { ...current, ...patch, updatedAt: new Date().toISOString() } : current))
  }

  function updateBlock(blockId: string, block: PersonalBlock) {
    update({ blocks: topic!.blocks.map((item) => (item.id === blockId ? block : item)) })
  }

  return (
    <div className="page" style={{ paddingTop: "1.4rem" }}>
      <p className="topic-status"><span className="kicker">个人专题</span><span className="save-state" data-state={message}>{message}</span></p>
      <p className="meta">自己的话和引用用不同的排版。不能插入图片。</p>
      <div className="stack" style={{ maxWidth: "40rem", marginTop: "1rem" }}>
        <Input value={topic.title} onChange={(event) => update({ title: event.target.value })} aria-label="专题标题" />
        <Textarea value={topic.description} onChange={(event) => update({ description: event.target.value })} placeholder="这个专题是给你自己看的说明" />
        {topic.blocks.map((block, index) => (
          <article key={block.id} className="note-card">
            <p className="meta">{block.kind === "text" ? "自己的话" : "引用"}</p>
            {block.kind === "text" ? (
              <Textarea className="text-block" value={block.body} onChange={(event) => updateBlock(block.id, { ...block, body: event.target.value })} />
            ) : (
              <>
                <p>「{block.quote}」</p>
                <p className="meta">
                  来自 <Link to={`/read/${block.articleId}`}>原文</Link>
                </p>
                <Input
                  value={block.note}
                  onChange={(event) => updateBlock(block.id, { ...block, note: event.target.value })}
                  placeholder="引用旁边的一句说明"
                />
              </>
            )}
            <div className="row">
              <Button
                disabled={index === 0}
                onClick={() => {
                  const blocks = [...topic.blocks]
                  const [item] = blocks.splice(index, 1)
                  if (item) blocks.splice(index - 1, 0, item)
                  update({ blocks })
                }}
              >
                上移
              </Button>
              <Button
                onClick={() => update({ blocks: topic.blocks.filter((item) => item.id !== block.id) })}
              >
                移除
              </Button>
            </div>
          </article>
        ))}
        <div className="row">
          <Button
            onClick={() =>
              update({
                blocks: [...topic.blocks, { id: newId("block"), kind: "text", body: "" }],
              })
            }
          >
            加一段自己的话
          </Button>
          <label>
            从划线加入
            <select
              className="field"
              value=""
              onChange={(event) => {
                const mark = highlights.find((item) => item.id === event.target.value)
                if (!mark) return
                update({
                  blocks: [
                    ...topic.blocks,
                    { id: newId("block"), kind: "quote", articleId: mark.articleId, quote: mark.quote, note: "" },
                  ],
                })
              }}
            >
              <option value="">选择一条摘录</option>
              {highlights.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.quote.slice(0, 28)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <aside className="topic-preview" aria-label="预览">
          <h2>{topic.title}</h2>
          {topic.blocks.map((block) => block.kind === "text" ? <p key={block.id}>{block.body}</p> : <blockquote key={block.id}>{block.quote}</blockquote>)}
        </aside>
        <div className="row">
          <Button
            variant="solid"
            onClick={() => {
              setMessage("正在保存")
              void lib.store.savePersonalTopic(topic).then(() => {
                setMessage("已保存")
                lib.refresh()
                if (id === "new") navigate(`/me/topics/${topic.id}`, { replace: true })
              }).catch(() => setMessage("保存失败"))
            }}
          >
            保存专题
          </Button>
          {id !== "new" ? (
            <Button
              onClick={() => {
                if (!window.confirm("删除这个专题？文章和划线不会一起删除。")) return
                void lib.store.deletePersonalTopic(topic.id).then(() => {
                  lib.refresh()
                  navigate("/me?tab=topics")
                })
              }}
            >
              删除专题
            </Button>
          ) : null}
          <Link to="/me?tab=topics">返回个人专题</Link>
        </div>
      </div>
    </div>
  )
}
