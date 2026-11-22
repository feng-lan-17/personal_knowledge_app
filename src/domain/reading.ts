export function readingMinutes(body: string): number {
  const chars = body.replace(/\s+/g, "").length
  return Math.max(4, Math.round(chars / 480))
}
