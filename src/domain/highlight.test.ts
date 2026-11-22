import { describe, expect, it } from "vitest"
import { locateQuote, selectionContext } from "./highlight.ts"

describe("划线定位", () => {
  const text = "雨落在铁皮上。后来又写到雨落在铁皮上，车还没有来。"

  it("用前后文区分重复句子", () => {
    const second = text.lastIndexOf("雨落在铁皮上")
    const anchor = selectionContext(text, second, second + "雨落在铁皮上".length, 8)
    const found = locateQuote(text, anchor)
    expect(found).toEqual({ start: second, end: second + "雨落在铁皮上".length })
  })

  it("正文里没有的句子返回空", () => {
    expect(locateQuote(text, { quote: "台灯", prefix: "", suffix: "" })).toBeNull()
  })
})
