import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import type { ComponentProps } from "react"

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root className={`checkbox ${className ?? ""}`} {...props}>
      <CheckboxPrimitive.Indicator>✓</CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
