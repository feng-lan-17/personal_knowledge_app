export function preserveView(mutate: () => void) {
  const probe = document.elementFromPoint(Math.min(window.innerWidth * 0.45, 720), 168)
  const block = probe?.closest("p, h1, h2, h3, pre, li, blockquote") as HTMLElement | null
  const before = block?.getBoundingClientRect().top
  mutate()
  requestAnimationFrame(() => {
    if (!block || before === undefined) return
    const after = block.getBoundingClientRect().top
    if (Math.abs(after - before) > 1) window.scrollBy({ top: after - before })
  })
}
