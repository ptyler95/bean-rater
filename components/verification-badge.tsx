import { Badge } from "@/components/ui/badge"
import { VERIFICATION_LABELS } from "@/lib/labels"
import type { Enums } from "@/lib/database.types"

export function VerificationBadge({
  status,
}: {
  status: Enums<"verification_status">
}) {
  if (status === "unverified") return null
  return (
    <Badge
      variant={status === "roaster_verified" ? "default" : "secondary"}
      className="font-mono text-[10px] uppercase tracking-wider"
    >
      {VERIFICATION_LABELS[status]}
    </Badge>
  )
}
