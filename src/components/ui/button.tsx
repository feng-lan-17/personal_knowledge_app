import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils.ts"

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      quiet: "btn-quiet",
      solid: "btn-solid",
      danger: "btn-danger",
    },
    size: {
      default: "",
      sm: "btn-sm",
    },
  },
  defaultVariants: { variant: "quiet", size: "default" },
})

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const classNames = cn(buttonVariants({ variant, size }), className)
  if (asChild) return <Slot className={classNames} {...props} />
  return <button className={classNames} type={type} {...props} />
}
