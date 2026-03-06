"use client"

import {
  MoveVertical,
  RefreshCw,
  Plus,
  ArrowDownUp,
  Minus,
  SquareCheckBig,
  type LucideIcon,
} from "lucide-react"

const CHANGE_TYPE_CONFIG: Record<
  string,
  { Icon: LucideIcon; colorClass: string }
> = {
  move: { Icon: MoveVertical, colorClass: "text-yellow-600" },
  replace: { Icon: RefreshCw, colorClass: "text-orange-600" },
  add: { Icon: Plus, colorClass: "text-green-600" },
  swap: { Icon: ArrowDownUp, colorClass: "text-yellow-600" },
  cut: { Icon: Minus, colorClass: "text-red-600" },
  pick: { Icon: SquareCheckBig, colorClass: "text-green-600" },
}

export function getChangeTypeIcon(changeType: string): {
  Icon: LucideIcon
  colorClass: string
} | null {
  const key = changeType.toLowerCase().trim()
  return CHANGE_TYPE_CONFIG[key] ?? null
}
