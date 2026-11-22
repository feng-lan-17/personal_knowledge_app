/**
 * 迁移与同步的预留口。
 * V1 只通过备份文件手工迁移，不实现手机端，也不做实时同步。
 */
export interface MigrationPort {
  kind: "manual-backup"
  description: string
  pushRealtime(): Promise<never>
}

export function migrationPort(): MigrationPort {
  return {
    kind: "manual-backup",
    description: "迁移只通过设置里的备份文件。实时同步和手机端都未实现。",
    pushRealtime() {
      return Promise.reject(new Error("实时同步未实现。请使用设置中的备份与恢复。"))
    },
  }
}
