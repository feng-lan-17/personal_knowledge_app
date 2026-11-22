export interface GlossaryEntry {
  id: string
  term: string
  gloss: string
  example: string
  formula?: string
  more?: string
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: "token",
    term: "Token",
    gloss: "模型真正读写的单位，来自词表，不一定等于一个字或一个词。",
    example: "同一段话里，一句中文和一串编号所占的 token 数可以差很多，费用和窗口都按 token 计算。",
    more: "不同模型的词表不一样。不能用某个网页上的切分结果换算你正在用的另一个模型。",
  },
  {
    id: "context",
    term: "上下文窗口",
    gloss: "这一次生成时，模型能看见的全部内容的长度上限。",
    example: "系统说明、之前几轮对话，和你刚贴进来的材料，都挤在同一个窗口里。放不进去的部分，这一轮等于没说。",
    more: "窗口里的具体数字随产品和版本变化。使用前先扣掉固定开销和留给回答的位置，再决定贴多少材料。",
  },
  {
    id: "attention",
    term: "注意力",
    gloss: "生成当前位置时，给上文各个位置不同的权重，再按权重把信息加起来。",
    example: "问「材料里的日期是哪一天」时，和日期那几个 token 更匹配的位置会得到更高的权重。",
    formula: "Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V",
    more: "除以 √dₖ 是为了维度变大以后点积不至于把 softmax 压得过尖。多头是把向量拆开各做一次再拼回去。完整推导见《从注意力到一次训练》。",
  },
  {
    id: "softmax",
    term: "Softmax",
    gloss: "把一排实数变成非负、加总为 1 的权重。",
    example: "三个分数 1、2、3，经过 softmax 之后最大的那个占的比重最高，但其余两个不会变成零。",
    formula: "softmax(z)ᵢ = exp(zᵢ) / Σⱼ exp(zⱼ)",
    more: "温度把分数先按比例缩放。温度低，高分更独占；温度高，分布更平。这只影响怎么抽样，不增加模型看见的事实。",
  },
  {
    id: "rag",
    term: "RAG",
    gloss: "先从资料里检索片段，把片段放进上下文，然后再生成。",
    example: "库里有十二篇文章。问题先命中其中两段，这两段才和问题一起交给模型。检索错了，生成会顺着错的片段往下说。",
    more: "本程序的检索页只做本地全文检索，不把命中装成模型的回答。",
  },
  {
    id: "agent",
    term: "Agent",
    gloss: "模型可以提出调用工具，但只有程序真的执行并把结果写回上下文之后，才算用过这个工具。",
    example: "没有一次真实的检索返回，回答里就不该写「我已经查过你的笔记」。",
  },
]

export function glossaryById(id: string): GlossaryEntry | undefined {
  return GLOSSARY.find((entry) => entry.id === id)
}
