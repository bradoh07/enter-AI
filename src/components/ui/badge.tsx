import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge variants encode meaning, not decoration:
 * - `computed` / `estimation` / `ai` distinguish where a statement came from
 * - `optimistic` / `base` / `pessimistic` identify a scenario everywhere it appears
 * - the rest are status colours
 * Sky blue is reserved for AI output and chart accents, which keeps it scarce
 * enough to stay meaningful.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/85",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-border bg-card text-foreground",
        /* Provenance */
        computed: "border-brown/25 bg-brown/8 text-brown",
        ai: "border-skyblue-ink/35 bg-skyblue/25 text-skyblue-ink",
        estimation: "border-warning/35 bg-warning/12 text-warning",
        /* Scenario identity */
        optimistic: "border-transparent bg-scenario-optimistic/14 text-scenario-optimistic",
        base: "border-transparent bg-scenario-base/12 text-scenario-base",
        pessimistic: "border-transparent bg-scenario-pessimistic/18 text-scenario-pessimistic",
        /* Status */
        success: "border-transparent bg-success/12 text-success",
        warning: "border-transparent bg-warning/12 text-warning",
        info: "border-transparent bg-info/12 text-info",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
