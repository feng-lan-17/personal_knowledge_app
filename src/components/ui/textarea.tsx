import type { TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils.ts"

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field field-area", className)} {...props} />
}
