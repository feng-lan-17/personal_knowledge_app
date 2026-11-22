import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils.ts"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field", className)} {...props} />
}
