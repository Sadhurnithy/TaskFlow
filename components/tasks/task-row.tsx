"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import {
    Calendar,
    GripVertical,
    MoreHorizontal,
    Link as LinkIcon,
    GitGraph,
    Trash2,
    Copy,
    Edit // Adding Edit icon
} from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { toggleTaskStatus, duplicateTask, deleteTask } from "@/actions/task-actions"
import { TaskDetailModal } from "./task-detail-modal"
import { toast } from "sonner"
import type { TaskWithRelations } from "@/types/task"
import { TaskStatus, Priority } from "@prisma/client"

// Configuration for status/priority visuals
const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
    [TaskStatus.TODO]: { label: "To Do", color: "text-slate-600", bg: "bg-slate-100" },
    [TaskStatus.IN_PROGRESS]: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-100" },
    [TaskStatus.IN_REVIEW]: { label: "In Review", color: "text-purple-600", bg: "bg-purple-100" },
    [TaskStatus.DONE]: { label: "Done", color: "text-green-600", bg: "bg-green-100" },
    [TaskStatus.CANCELLED]: { label: "Canceled", color: "text-red-600", bg: "bg-red-100" },
}

const priorityConfig: Record<Priority, { label: string; icon?: any; color: string }> = {
    [Priority.LOW]: { label: "Low", color: "text-slate-500" },
    [Priority.MEDIUM]: { label: "Medium", color: "text-orange-500" },
    [Priority.HIGH]: { label: "High", color: "text-red-500" },
    [Priority.URGENT]: { label: "Urgent", color: "text-red-600 font-bold" },
    [Priority.NONE]: { label: "None", color: "text-slate-400" },
}

interface TaskRowProps {
    task: TaskWithRelations
    workspaceId: string
    workspaceSlug: string
    currentUserRole?: string | null
}

export function TaskRow({ task, workspaceId, workspaceSlug, currentUserRole }: TaskRowProps) {
    const [isPending, startTransition] = React.useTransition()
    const [optimisticStatus, setOptimisticStatus] = React.useOptimistic(task.status)
    const [showDetail, setShowDetail] = React.useState(false)
    const [isSwiped, setIsSwiped] = React.useState(false)

    const isCompleted = optimisticStatus === TaskStatus.DONE
    const linkedNotes = task.notes || []

    // Drag and Drop (Desktop sorting)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: { type: "Task", task }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    // Swipe Actions (Mobile)
    const x = useMotionValue(0)
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -50) {
            setIsSwiped(true)
        } else {
            setIsSwiped(false)
        }
    }

    const resetSwipe = () => {
        setIsSwiped(false)
        // Reset motion value manually if needed, but react state usually handles re-render
    }

    const handleToggleStatus = (checked: boolean | string) => {
        const newStatus = isCompleted ? TaskStatus.TODO : TaskStatus.DONE
        startTransition(async () => {
            setOptimisticStatus(newStatus)
            const result = await toggleTaskStatus(task.id, workspaceId)
            if (!result.success) {
                toast.error("Failed to update status")
            }
        })
    }

    const handleDuplicate = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        resetSwipe()
        startTransition(async () => {
            const result = await duplicateTask(task.id, workspaceId)
            if (result.success) {
                toast.success("Task duplicated")
            } else {
                toast.error("Failed to duplicate task")
            }
        })
    }

    const handleDelete = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        resetSwipe()
        startTransition(async () => {
            const result = await deleteTask(task.id, workspaceId)
            if (result.success) {
                toast.success("Task deleted")
            } else {
                toast.error("Failed to delete task")
            }
        })
    }

    // Perms
    const canEdit = ["OWNER", "ADMIN", "MEMBER"].includes(currentUserRole || "")

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className="relative group mb-3 md:mb-3" // Added desktop spacing
            >
                {/* Mobile Background Actions (Revealed via Swipe is simulated visually here by layout, 
                    but simpler using just regular div behind motion.div) */}
                {canEdit && (
                    <div className="md:hidden absolute inset-0 flex items-center justify-end pr-4 gap-2 bg-red-50/50 dark:bg-red-900/10 rounded-xl">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleDuplicate}
                            className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-background"
                        >
                            <Copy className="h-5 w-5" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleDelete}
                            className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                )}

                {/* Foreground Card */}
                <motion.div
                    drag={canEdit ? "x" : false}
                    dragConstraints={{ left: -120, right: 0 }}
                    dragElastic={0.1}
                    onDragStart={() => resetSwipe()} // clear swipe state on new drag
                    whileTap={canEdit ? { cursor: "grabbing" } : undefined}
                    onClick={() => setShowDetail(true)}
                    className={cn(
                        "relative flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 py-2.5 px-3 md:py-2 md:px-3 bg-white dark:bg-background border rounded-xl md:rounded-lg shadow-sm md:shadow-none hover:border-border hover:shadow-md transition-shadow cursor-default select-none z-10",
                        isDragging && "z-50 shadow-xl ring-2 ring-primary/20 bg-background/90"
                    )}
                >
                    {/* Drag Handle (Desktop Only) */}
                    {canEdit && (
                        <div
                            {...attributes}
                            {...listeners}
                            className="hidden md:block opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab active:cursor-grabbing transition-opacity -ml-1"
                        >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}

                    {/* Checkbox Column */}
                    <div className="flex items-center pt-1 md:pt-0 shrink-0" onClick={(e) => {
                        e.stopPropagation()
                        if (!canEdit) toast.error("You don't have permission to update task status")
                    }}>
                        <Checkbox
                            checked={isCompleted}
                            onCheckedChange={(c) => {
                                if (!canEdit) return
                                handleToggleStatus(c)
                            }}
                            disabled={!canEdit}
                            className={cn(
                                "transition-all data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                                "h-5 w-5 md:h-4 md:w-4 rounded-full border-2",
                                isCompleted ? "opacity-50" : "opacity-70 group-hover:opacity-100",
                                !canEdit && "opacity-50 cursor-not-allowed"
                            )}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 flex-1 min-w-0 w-full">

                        {/* Title Row */}
                        <div className="flex items-center justify-between gap-2 w-full md:w-auto md:contents">
                            <Link
                                href={`/workspace/${workspaceSlug}/tasks/${task.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                    "text-base md:text-sm font-medium transition-colors hover:underline underline-offset-4 leading-snug md:leading-normal flex-1 line-clamp-2 md:truncate md:line-clamp-none",
                                    isCompleted ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"
                                )}
                            >
                                {task.title}
                            </Link>

                            {/* Priority Icon (Mobile) */}
                            <div className="md:hidden text-muted-foreground shrink-0">
                                {priorityConfig[task.priority]?.icon && React.createElement(priorityConfig[task.priority].icon as any, {
                                    className: cn("h-3.5 w-3.5", priorityConfig[task.priority].color)
                                })}
                            </div>
                        </div>

                        {/* Metadata Row */}
                        <div className="flex items-center gap-2 md:gap-3 text-xs text-muted-foreground/70 w-full md:w-auto md:contents">
                            {/* Priority Dot (Desktop) */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={cn("hidden md:block h-1.5 w-1.5 rounded-full shrink-0", priorityConfig[task.priority]?.color.replace("text-", "bg-"))} />
                                    </TooltipTrigger>
                                    <TooltipContent>Priority: {priorityConfig[task.priority]?.label}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Status Chip */}
                            <div className={cn(
                                "px-2 py-0.5 rounded-full md:rounded-md text-[10px] font-medium shrink-0",
                                statusConfig[optimisticStatus]?.bg,
                                statusConfig[optimisticStatus]?.color
                            )}>
                                {statusConfig[optimisticStatus]?.label}
                            </div>

                            <span className="md:hidden text-muted-foreground/30">•</span>

                            <div className="flex items-center gap-2.5 md:gap-3 overflow-hidden">
                                {(task.subtasks?.length || 0) > 0 && (
                                    <div className="flex items-center gap-1 tabular-nums shrink-0">
                                        <GitGraph className="h-3 w-3" />
                                        <span>
                                            {task.subtasks?.filter((t: any) => t.status === "DONE").length}/{task.subtasks?.length}
                                        </span>
                                    </div>
                                )}

                                {task.dueDate && (
                                    <div className={cn(
                                        "flex items-center gap-1.5 tabular-nums shrink-0",
                                        task.dueDate < new Date() && !isCompleted ? "text-red-500" : ""
                                    )}>
                                        <Calendar className="h-3 w-3" />
                                        <span>{format(task.dueDate, "MMM d")}</span>
                                    </div>
                                )}

                                {linkedNotes.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 pl-2 md:pl-0 border-l md:border-l-0 border-border/50 md:border-none min-w-0 max-w-[200px]">
                                        {linkedNotes.slice(0, 3).map((noteRef, index) => (
                                            <Link
                                                key={noteRef.note.id}
                                                href={`/workspace/${workspaceSlug}/notes/${noteRef.note.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] truncate max-w-[100px] transition-colors border border-blue-500/20"
                                            >
                                                <LinkIcon className="h-2.5 w-2.5 shrink-0" />
                                                <span className="truncate">{noteRef.note.title}</span>
                                            </Link>
                                        ))}
                                        {linkedNotes.length > 3 && (
                                            <span className="text-[9px] text-muted-foreground font-medium pl-1">+{linkedNotes.length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {task.assignee && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="hidden md:block">
                                            <Avatar className="h-5 w-5 border border-background">
                                                <AvatarImage src={task.assignee.image || undefined} />
                                                <AvatarFallback className="text-[8px]">{task.assignee.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>{task.assignee.name}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>

                    {/* Actions Menu (Desktop Only) */}
                    {canEdit && (
                        <div className="hidden md:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                                    >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                        <span className="sr-only">Actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </motion.div>
            </div>

            <TaskDetailModal
                task={task}
                open={showDetail}
                onOpenChange={setShowDetail}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
            />
        </>
    )
}
