import type { ModelSlot } from "./types.ts"

export interface AiStatus {
  connected: false
  providerId: "none"
  headline: string
  detail: string
}

export interface AiCompletionRequest {
  question: string
  contextArticleIds: string[]
  selection?: string
}

export interface AiCompletionResult {
  ok: false
  reason: "not_connected"
  message: string
}

export interface AiClient {
  status(): AiStatus
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>
}

export const DISCONNECTED_MESSAGE =
  "AI 未连接。没有可用的模型服务，这次不会生成回答，也不会编造引用。本地全文检索仍然可用。"

/**
 * 可替换的模型入口。未来的官方 API 或本地模型应实现 AiClient，
 * 并在真正发请求前明确告诉读者文字会送到哪里。
 * V1 的默认实现不发起网络请求。
 */
export interface AiAdapter {
  id: string
  label: string
  create(slot: ModelSlot): AiClient
}

export const disconnectedAdapter: AiAdapter = {
  id: "none",
  label: "未连接",
  create(slot) {
    return createDisconnectedClient(slot)
  },
}

export function createDisconnectedClient(slot: ModelSlot): AiClient {
  const hasSlot = Boolean(slot.baseUrl.trim() || slot.model.trim())
  return {
    status() {
      return {
        connected: false,
        providerId: "none",
        headline: "未连接",
        detail: hasSlot
          ? "服务地址和模型名只保存在本机阅读偏好里。这一版不会向该地址发送问题、选文或文章，也不会提示连接成功。"
          : "没有连接模型。预留的接口可以以后换成官方 API 或本地模型。本程序不索要密码或 Cookie，也不连接任何会员接口。",
      }
    },
    async complete() {
      return { ok: false, reason: "not_connected", message: DISCONNECTED_MESSAGE }
    },
  }
}
