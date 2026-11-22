import { describe, expect, it } from "vitest"
import { DISCONNECTED_MESSAGE, createDisconnectedClient } from "./ai.ts"

describe("未连接的 AI", () => {
  it("不返回回答，也不编造引用", async () => {
    const client = createDisconnectedClient({ baseUrl: "http://127.0.0.1:9", model: "local" })
    const status = client.status()
    expect(status.connected).toBe(false)
    expect(status.headline).toBe("未连接")
    expect(status.detail).toContain("不会向该地址发送")
    const result = await client.complete({
      question: "解释这段",
      contextArticleIds: ["llm-dialogue"],
      selection: "上下文窗口",
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("not_connected")
    expect(result.message).toBe(DISCONNECTED_MESSAGE)
    expect(result).not.toHaveProperty("answer")
    expect(JSON.stringify(result)).not.toContain("根据资料")
  })

  it("空配置也不会假装成功", () => {
    const status = createDisconnectedClient({ baseUrl: "", model: "" }).status()
    expect(status.connected).toBe(false)
    expect(status.detail).toContain("不索要密码")
  })
})
