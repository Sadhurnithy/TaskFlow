
"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    Check,
    Calendar,
    AlertCircle,
    ArrowUp,
    Circle,
    MoreHorizontal,
    GitGraph,
    User,
    Clock,
    FileText,
    Pencil
} from "lucide-react"
import { TaskStatus, Priority } from "@prisma/client"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import type { InboxItem, InboxReason } from "@/lib/db/queries/inbox"
import { toggleTaskStatus, updateTask } from "@/actions/task-actions" // Reuse existing actions
import { toast } from "sonner"
import Link from "next/link"

interface InboxRowProps {
    item: InboxItem
    workspaceSlug: string
}

// Visual config for reasons
const reasonConfig: Record<InboxReason, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    assigned_to_you: { label: "Assigned to you", icon: User, color: "text-blue-500", bg: "bg-blue-500/10" },
    due_soon: { label: "Due Soon", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    overdue: { label: "Overdue", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
    in_review: { label: "In Review", icon: GitGraph, color: "text-purple-500", bg: "bg-purple-500/10" },
    unprocessed: { label: "Missing Details", icon: Pencil, color: "text-orange-500", bg: "bg-orange-500/10" },
    snoozed: { label: "Snoozed", icon: Clock, color: "text-slate-500", bg: "bg-slate-500/10" },
    unknown: { label: "Inbox", icon: Circle, color: "text-slate-500", bg: "bg-slate-500/10" }
}

export function InboxRow({ item, workspaceSlug }: InboxRowProps) {
    const router = useRouter()
    const [isPending, startTransition] = React.useTransition()
    const [optimisticStatus, setOptimisticStatus] = React.useOptimistic(item.status)
    const reason = reasonConfig[item.inboxReason] || reasonConfig.unknown

    const handleMarkDone = (e: React.MouseEvent) => {
        e.stopPropagation()
        startTransition(async () => {
            setOptimisticStatus(TaskStatus.DONE)
            const res = await toggleTaskStatus(item.id, item.workspaceId)
            if (res.success) {
                toast.success("Task completed")
            } else {
                toast.error("Failed to complete task")
                setOptimisticStatus(item.status) // Revert
            }
        })
    }

    // Swipe Logic
    const x = useMotionValue(0)
    const [swipeAction, setSwipeAction] = React.useState<"done" | "snooze" | null>(null)
    const [members, setMembers] = React.useState<any[]>([])

    const handleDragEnd = async (_: any, info: any) => {
        const offset = info.offset.x
        if (offset > 100) {
            // Swiped Right -> Done
            setSwipeAction("done")
            startTransition(async () => {
                setOptimisticStatus(TaskStatus.DONE)
                const res = await toggleTaskStatus(item.id, item.workspaceId)
                if (res.success) {
                    toast.success("Task completed")
                    router.refresh()
                } else {
                    toast.error("Failed to complete task")
                    setOptimisticStatus(item.status)
                    setSwipeAction(null)
                }
            })
        } else if (offset < -100) {
            // Swiped Left -> Snooze (Default to 1 day)
            setSwipeAction("snooze")
            handleSnooze(1)
        }
    }

    if (optimisticStatus === TaskStatus.DONE) {
        return null
    }

    // Actions
    // Moved members state up
    const handleSnooze = (days: number) => {
        startTransition(async () => {
            const newDate = new Date()
            newDate.setDate(newDate.getDate() + days)

            const res = await updateTask(item.id, { dueDate: newDate, workspaceId: item.workspaceId })
            if (res.success) {
                toast.success(`Snoozed until ${format(newDate, "MMM d")}`)
                router.refresh()
            } else {
                toast.error("Failed to snooze task")
            }
            setSwipeAction(null)
        })
    }

    const fetchMembers = async () => {
        if (members.length > 0) return
        const { getWorkspaceMembersAction } = await import("@/actions/workspace-actions")
        const result = await getWorkspaceMembersAction(item.workspaceId)
        setMembers(result)
    }

    const handleAssign = (userId: string) => {
        startTransition(async () => {
            const res = await updateTask(item.id, { assigneeId: userId, workspaceId: item.workspaceId })
            if (res.success) {
                toast.success("Assignee updated")
                router.refresh()
            } else {
                toast.error("Failed to update assignee")
            }
        })
    }

    return (
        <div className="relative group touch-pan-y">
            {/* Background Actions Layer */}
            <div className="absolute inset-0 rounded-lg flex items-center justify-between px-4 z-0 overflow-hidden">
                <motion.div
                    style={{ opacity: x.get() > 0 ? 1 : 0 }}
                    className="absolute left-0 inset-y-0 w-full bg-emerald-500 rounded-lg flex items-center justify-start px-4"
                >
                    <Check className="h-6 w-6 text-white" />
                </motion.div>

                <motion.div
                    style={{ opacity: x.get() < 0 ? 1 : 0 }}
                    className="absolute right-0 inset-y-0 w-full bg-amber-500 rounded-lg flex items-center justify-end px-4"
                >
                    <Clock className="h-6 w-6 text-white" />
                </motion.div>
            </div>

            <motion.div
                layout
                drag="x"
                dragConstraints={{ left: 0, right: 0 }} // Snap back
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ x }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                className={cn(
                    "relative z-10 flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm hover:shadow-md hover:border-border transition-all select-none",
                    "active:cursor-grabbing cursor-grab"
                )}
            >
                {/* 1. Quick Action: Mark Done */}
                <div onPointerDown={(e) => e.stopPropagation()}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleMarkDone}
                                    disabled={isPending}
                                    className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all shrink-0"
                                >
                                    <Check className="h-3.5 w-3.5 text-transparent hover:text-primary transition-colors" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Mark Complete</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* 2. Main Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5 pointer-events-none sm:pointer-events-auto">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/workspace/${workspaceSlug}/tasks/${item.id}`}
                            className="font-medium text-[15px] leading-tight text-foreground truncate pointer-events-auto"
                        >
                            {item.title || "Untitled Task"}
                        </Link>

                        {(item.priority === Priority.HIGH || item.priority === Priority.URGENT) && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-red-500 border-red-200 bg-red-50 shrink-0">
                                {item.priority.toLowerCase()}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0", reason.bg, reason.color)}>
                            <reason.icon className="h-3 w-3" />
                            <span>{reason.label}</span>
                        </div>

                        <span className="truncate max-w-[120px] sm:max-w-[200px] text-[11px] opacity-80">
                            {item.description ? item.description.substring(0, 60) : ""}
                        </span>
                    </div>

                    {/* Linked Note Preview (One-line) */}
                    {item.notes && item.notes.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 pl-0.5">
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{item.notes[0]?.note.title}</span>
                            {item.notes.length > 1 && <span>+{item.notes.length - 1}</span>}
                        </div>
                    )}
                </div>

                {/* 3. Right Side Meta & Actions */}
                <div className="flex items-center gap-3 shrink-0">

                    {item.dueDate && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs tabular-nums",
                            new Date(item.dueDate) < new Date() ? "text-red-500 font-medium" : "text-muted-foreground"
                        )}>
                            <span className="hidden sm:inline">Due</span>
                            <span>{format(new Date(item.dueDate), "MMM d")}</span>
                        </div>
                    )}

                    <div className="hidden sm:block">
                        {item.assignee && (
                            <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={item.assignee.image || undefined} />
                                <AvatarFallback className="text-[9px]">{item.assignee.name?.[0]}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>

                    <div onPointerDown={(e) => e.stopPropagation()}>
                        <DropdownMenu onOpenChange={(open) => {
                            if (open) fetchMembers()
                        }}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground/50 hover:text-foreground">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleSnooze(1)}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>Snooze until tomorrow</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSnooze(2)}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>Snooze 2 days</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Assign to...</div>
                                {members.length === 0 ? (
                                    <div className="px-2 py-2 text-xs text-muted-foreground text-center">Loading...</div>
                                ) : (
                                    <div className="max-h-[200px] overflow-y-auto">
                                        {members.map((member) => (
                                            <DropdownMenuItem
                                                key={member.userId}
                                                onClick={() => handleAssign(member.userId)}
                                                className="gap-2"
                                            >
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={member.user.image} />
                                                    <AvatarFallback>{member.user.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <span>{member.user.name}</span>
                                                {item.assigneeId === member.userId && <Check className="ml-auto h-3 w-3" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

