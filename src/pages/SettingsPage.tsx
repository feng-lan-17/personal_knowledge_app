import { useEffect, useState } from "react"
import { previewBackup } from "../domain/backup.ts"
import type { BackupPreview } from "../domain/backup.ts"
import { parseMarkdownImport } from "../domain/markdown.ts"
import type { ContentNotice, Measure, ReadingPrefs, ThemeName } from "../domain/types.ts"
import { migrationPort } from "../storage/sync.ts"
import { Button } from "../components/ui/button.tsx"
import { Checkbox } from "../components/ui/checkbox.tsx"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../components/ui/dialog.tsx"
import { Input } from "../components/ui/input.tsx"
import { useLibrary } from "../library/context.tsx"
import { downloadText } from "../lib/download.ts"

export function SettingsPage() {
  const lib = useLibrary()
  const [notices, setNotices] = useState<ContentNotice[]>([])
  const [importRaw, setImportRaw] = useState("")
  const [importPreview, setImportPreview] = useState("")
  const [backupRaw, setBackupRaw] = useState<unknown>(null)
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null)
  const [backupErrors, setBackupErrors] = useState<string[]>([])
  const [ack, setAck] = useState(false)
  const [dialog, setDialog] = useState<"import" | "restore" | null>(null)
  const [message, setMessage] = useState("")
  const migration = migrationPort()

  useEffect(() => {
    document.title = "设置 · 私人知识图书馆"
    void lib.store.listContentNotices().then(setNotices)
  }, [lib.store, lib.tick])

  function patch(partial: Partial<ReadingPrefs>) {
    void lib.updatePrefs({ ...lib.prefs, ...partial })
  }

  return (
    <div className="page" style={{ paddingTop: "1.3rem" }}>
      <p className="kicker">设置</p>
      <h1 className="block-title">阅读与数据</h1>

      <section className="section">
        <h2>阅读偏好</h2>
        <fieldset className="stack">
          <legend className="meta">字号</legend>
          <div className="row">
            <ScaleChoice label="小" current={lib.prefs.fontScale} value={0.94} onPick={(fontScale) => patch({ fontScale })} />
            <ScaleChoice label="中" current={lib.prefs.fontScale} value={1} onPick={(fontScale) => patch({ fontScale })} />
            <ScaleChoice label="大" current={lib.prefs.fontScale} value={1.12} onPick={(fontScale) => patch({ fontScale })} />
          </div>
          <legend className="meta">行距</legend>
          <div className="row">
            <ScaleChoice label="紧" current={lib.prefs.lineHeight} value={1.7} onPick={(lineHeight) => patch({ lineHeight })} />
            <ScaleChoice label="适中" current={lib.prefs.lineHeight} value={1.9} onPick={(lineHeight) => patch({ lineHeight })} />
            <ScaleChoice label="松" current={lib.prefs.lineHeight} value={2.1} onPick={(lineHeight) => patch({ lineHeight })} />
          </div>
          <legend className="meta">技术文宽度。散文版心另有上限，不会跟着拉得很宽。</legend>
          <div className="row">
            {(["narrow", "comfort", "wide"] as Measure[]).map((measure) => (
              <Button key={measure} aria-pressed={lib.prefs.measure === measure} onClick={() => patch({ measure })}>
                {measure === "narrow" ? "窄" : measure === "wide" ? "宽" : "适中"}
              </Button>
            ))}
          </div>
          <legend className="meta">底色</legend>
          <div className="row">
            {(["paper", "night"] as ThemeName[]).map((theme) => (
              <Button key={theme} aria-pressed={lib.prefs.theme === theme} onClick={() => patch({ theme })}>
                {theme === "paper" ? "纸色" : "夜读"}
              </Button>
            ))}
          </div>
          <label className="choice">
            <Checkbox checked={lib.prefs.essayIndent} onCheckedChange={(value) => patch({ essayIndent: value === true })} />
            散文段首缩进
          </label>
        </fieldset>
      </section>

      <section className="section">
        <h2>数据</h2>
        <p data-testid="engine-label">
          引擎：{lib.info.engineLabel}。位置：{lib.info.locationLabel}
        </p>
        <p>{lib.info.locationDetail}</p>
        <p className="meta">
          桌面版的 Markdown 在数据目录的 content，附件目录是 attachments。直接改文件不会自动覆盖库内正文。浏览器预览没有这两个磁盘目录，正文在 IndexedDB 的 documents 仓库。
        </p>
        <p className="meta">{migration.description}</p>
        <div className="row">
          <Button
            onClick={() => {
              void lib.store.exportBackup().then((bundle) => {
                downloadText(`pkl-backup-${bundle.exportedAt.slice(0, 10)}.json`, JSON.stringify(bundle, null, 2), "application/json")
              })
            }}
          >
            导出备份
          </Button>
        </div>
        <div className="stack" style={{ marginTop: "1rem" }}>
          <label>
            导入 Markdown
            <input
              className="field"
              type="file"
              accept=".md,text/markdown"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                void file.text().then((raw) => {
                  setImportRaw(raw)
                  const parsed = parseMarkdownImport(raw)
                  setImportPreview(parsed.ok ? `将导入「${parsed.draft.title}」，栏目 ${parsed.draft.columnId}。这不是审定教材。` : parsed.errors.join(" "))
                  setAck(false)
                  if (parsed.ok) setDialog("import")
                  else setMessage(parsed.errors.join(" "))
                })
              }}
            />
          </label>
          <label>
            恢复备份
            <input
              className="field"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                void file.text().then((raw) => {
                  let parsedJson: unknown
                  try {
                    parsedJson = JSON.parse(raw)
                  } catch {
                    setBackupErrors(["这不是合法的 JSON。"])
                    setBackupPreview(null)
                    setMessage("这不是合法的 JSON。")
                    return
                  }
                  const preview = previewBackup(parsedJson)
                  setBackupRaw(parsedJson)
                  setAck(false)
                  if (!preview.ok) {
                    setBackupErrors(preview.errors)
                    setBackupPreview(null)
                    setMessage(preview.errors.join(" "))
                    return
                  }
                  setBackupErrors([])
                  setBackupPreview(preview.preview)
                  setDialog("restore")
                })
              }}
            />
          </label>
        </div>
        {message ? <p>{message}</p> : null}
        {notices.length ? (
          <ul className="plain-list">
            {notices.map((notice) => (
              <li key={`${notice.kind}-${notice.articleId}`}>
                <b>{notice.title}</b>
                <p>{notice.detail}</p>
                {notice.kind === "pending-seed" ? (
                  <Button
                    onClick={() => {
                      if (!window.confirm("用随程序带来的新正文替换这篇？笔记会保留。")) return
                      void lib.store.acceptPendingSeed(notice.articleId, { confirmed: true }).then(() => {
                        setMessage("已替换正文，笔记还在。")
                        lib.refresh()
                      })
                    }}
                  >
                    确认替换正文
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (!window.confirm("用磁盘上的 Markdown 替换库内正文？笔记会保留。")) return
                      void lib.store.loadDivergedFile(notice.articleId, { confirmed: true }).then(() => {
                        setMessage("已从文件读入。")
                        lib.refresh()
                      }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "没有读入"))
                    }}
                  >
                    确认从文件读入
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">当前没有待确认的正文更新。</p>
        )}
      </section>

      <section className="section" data-testid="ai-settings">
        <h2>AI</h2>
        <p className="status-line">{lib.ai.status().headline}</p>
        <p>{lib.ai.status().detail}</p>
        <div className="stack" style={{ maxWidth: "36rem" }}>
          <label>
            以后可能使用的服务地址
            <Input
              value={lib.prefs.modelSlot.baseUrl}
              onChange={(event) => patch({ modelSlot: { ...lib.prefs.modelSlot, baseUrl: event.target.value } })}
              placeholder="留空。这一版不会访问它"
            />
          </label>
          <label>
            模型名
            <Input
              value={lib.prefs.modelSlot.model}
              onChange={(event) => patch({ modelSlot: { ...lib.prefs.modelSlot, model: event.target.value } })}
              placeholder="留空"
            />
          </label>
        </div>
        <p className="meta">不填写密码、Cookie 或会员凭证。填写地址也不会发起连接，页面不会显示成功。</p>
      </section>

      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null) }}>
        <DialogContent>
          <DialogTitle>{dialog === "restore" ? "恢复前确认" : "导入前确认"}</DialogTitle>
          <DialogDescription>
            {dialog === "restore"
              ? `备份导出于 ${backupPreview?.exportedAt ?? ""}。将替换笔记 ${backupPreview?.notes ?? 0} 条、划线 ${backupPreview?.highlights ?? 0} 条、阅读标记 ${backupPreview?.reading ?? 0} 条、专题 ${backupPreview?.personalTopics ?? 0} 个、已确认草稿 ${backupPreview?.aiDrafts ?? 0} 份，并替换导入文章 ${backupPreview?.imported ?? 0} 篇。审定教材不会删除。`
              : importPreview}
            {backupErrors.length ? backupErrors.join(" ") : ""}
          </DialogDescription>
          <label className="choice">
            <Checkbox checked={ack} onCheckedChange={(value) => setAck(value === true)} />
            我知道这会写入本地库，而且不会悄悄删除教材
          </label>
          <div className="row" style={{ marginTop: "1rem" }}>
            <Button
              variant="solid"
              disabled={!ack}
              onClick={() => {
                if (dialog === "import") {
                  void lib.store.importMarkdown(importRaw, { confirmed: true }).then((result) => {
                    setMessage(`已导入「${result.title}」。`)
                    setDialog(null)
                    lib.refresh()
                  }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "没有导入"))
                } else if (backupRaw) {
                  void lib.store.restoreBackup(backupRaw, { confirmed: true }).then((report) => {
                    setMessage(`已恢复。跳过可能覆盖教材的 ${report.skipped.length} 篇。`)
                    setDialog(null)
                    lib.refresh()
                  }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "没有恢复"))
                }
              }}
            >
              确认写入
            </Button>
            <Button onClick={() => setDialog(null)}>取消</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ScaleChoice({
  label,
  current,
  value,
  onPick,
}: {
  label: string
  current: number
  value: number
  onPick: (value: number) => void
}) {
  return (
    <Button aria-pressed={current === value} onClick={() => onPick(value)}>
      {label}
    </Button>
  )
}
