"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, formatDistanceToNow } from "date-fns"
// Force rebuild for hydration fix
import { Calendar, CheckCircle2, MoreHorizontal, User as UserIcon, GripVertical, CheckSquare, ChevronRight, Users, FileText } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { toggleTaskStatus, duplicateTask, deleteTask } from "@/actions/task-actions"
import { TaskDetailModal } from "./task-detail-modal"
import { toast } from "sonner"
import type { TaskWithRelations } from "@/types/task"
import { TaskStatus, Priority } from "@prisma/client"
import { AlertCircle, ArrowUpCircle, Circle, HelpCircle } from "lucide-react"

const priorityConfig = {
    [Priority.URGENT]: { icon: AlertCircle, color: "text-red-600" },
    [Priority.HIGH]: { icon: ArrowUpCircle, color: "text-orange-600" },
    [Priority.MEDIUM]: { icon: Circle, color: "text-yellow-600" },
    [Priority.LOW]: { icon: ArrowUpCircle, color: "text-blue-600" }, // Using ArrowUp for low but blue, or maybe ArrowDown? Sticking to design consistency usually means simple icons.
    [Priority.NONE]: { icon: HelpCircle, color: "text-muted-foreground" },
}

interface TaskCardProps {
    task: TaskWithRelations
    view?: "list" | "board"
    workspaceId: string
    workspaceSlug: string
    isOverlay?: boolean
}

export function TaskCard({ task, view = "list", workspaceId, workspaceSlug, isOverlay }: TaskCardProps) {
    const [isPending, startTransition] = React.useTransition()
    const [optimisticStatus, setOptimisticStatus] = React.useOptimistic(task.status)
    const [showDetail, setShowDetail] = React.useState(false)
    const [isExpanded, setIsExpanded] = React.useState(false)

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    const isCompleted = optimisticStatus === TaskStatus.DONE
    const linkedNotes = task.notes || []

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: { type: "Task", task },
        disabled: isOverlay
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    if (isOverlay) {
        Object.assign(style, {
            opacity: 1,
            transform: undefined,
            transition: undefined,
            cursor: "grabbing",
            scale: "1.02",
            zIndex: 999,
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)"
        })
    }

    const handleToggleStatus = (e: React.MouseEvent) => {
        e.stopPropagation()
        const newStatus = isCompleted ? TaskStatus.TODO : TaskStatus.DONE
        startTransition(async () => {
            setOptimisticStatus(newStatus)
            const result = await toggleTaskStatus(task.id, workspaceId)
            if (!result.success) {
                toast.error("Failed to update status")
            }
        })
    }

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation()
        startTransition(async () => {
            const result = await duplicateTask(task.id, workspaceId)
            if (result.success) {
                toast.success("Task duplicated")
            } else {
                toast.error("Failed to duplicate task")
            }
        })
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        startTransition(async () => {
            const result = await deleteTask(task.id, workspaceId)
            if (result.success) {
                toast.success("Task deleted")
            } else {
                toast.error("Failed to delete task")
            }
        })
    }

    // List View
    if (view === "list") {
        return (
            <>
                <TaskDetailModal
                    workspaceId={workspaceId}
                    workspaceSlug={workspaceSlug}
                    task={task}
                    open={showDetail}
                    onOpenChange={setShowDetail}
                />
                <div className="flex flex-col">
                    <div
                        ref={setNodeRef}
                        style={style}
                        className={cn(
                            "group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border bg-card/50 hover:bg-card p-4 shadow-sm transition-all hover:shadow-md relative backdrop-blur-sm",
                            isCompleted && "opacity-60 bg-muted/40"
                        )}
                    >
                        {/* Left: Drag + Expand + Status */}
                        <div className="flex items-center gap-3">
                            <div
                                {...attributes}
                                {...listeners}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground/20 hover:text-foreground/60 transition-colors touch-none shrink-0"
                            >
                                <GripVertical className="h-4 w-4" />
                            </div>

                            {(task.subtaskCount || 0) > 0 ? (
                                <button
                                    onClick={toggleExpand}
                                    className="p-0.5 rounded-full hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
                                >
                                    <ChevronRight className={cn(
                                        "h-4 w-4 transition-transform duration-200",
                                        isExpanded && "rotate-90"
                                    )} />
                                </button>
                            ) : (
                                <div className="w-5 shrink-0" />
                            )}

                            <button
                                onClick={handleToggleStatus}
                                className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                    isCompleted
                                        ? "border-green-500 bg-green-500 text-white"
                                        : "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
                                )}
                            >
                                {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                        </div>

                        {/* Title & Linked Note */}
                        <div className="flex-1 min-w-0 grid gap-1.5 sm:gap-1">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/workspace/${workspaceSlug}/tasks/${task.id}`}
                                    className={cn(
                                        "truncate text-sm font-medium cursor-pointer hover:text-primary transition-colors block",
                                        isCompleted && "line-through text-muted-foreground"
                                    )}
                                >
                                    {task.title}
                                </Link>

                                {/* Mobile Priority Badge (if important) */}
                                {task.priority === Priority.URGENT && !isCompleted && (
                                    <span className="sm:hidden h-2 w-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                                )}
                            </div>

                            {/* Linked Note - Mobile & Desktop */}
                            {linkedNotes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {linkedNotes.map(({ note }) => (
                                        <Link
                                            key={note.id}
                                            href={`/workspace/${workspaceSlug}/notes/${note.id}`}
                                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-blue-600 transition-colors bg-blue-50/50 hover:bg-blue-50 w-fit px-2 py-0.5 rounded-full border border-blue-100/50"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <FileText className="h-3 w-3" />
                                            <span className="truncate max-w-[150px]">{note.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Metadata */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pl-11 sm:pl-0 flex-wrap sm:ml-auto">

                            {/* Priority Badge */}
                            {task.priority !== Priority.NONE && (
                                <Badge variant="outline" className={cn(
                                    "text-[10px] h-5 px-2 border-0 font-medium tracking-wide shadow-none",
                                    task.priority === Priority.URGENT ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20" :
                                        task.priority === Priority.HIGH ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20" :
                                            task.priority === Priority.MEDIUM ? "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20" :
                                                "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                                )}>
                                    {task.priority}
                                </Badge>
                            )}

                            {/* Status Badge */}
                            {!isCompleted && (
                                <Badge variant="outline" className={cn(
                                    "text-[10px] h-5 px-2 border-0 font-medium capitalize shadow-none",
                                    task.status === "TODO" ? "bg-slate-100 text-slate-700" :
                                        task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10" :
                                            task.status === "IN_REVIEW" ? "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10" :
                                                "bg-red-50 text-red-700"
                                )}>
                                    {task.status.replace(/_/g, " ")}
                                </Badge>
                            )}

                            {(task.subtaskCount || 0) > 0 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 bg-muted/30 px-2 h-5 rounded-md">
                                    <CheckSquare className="h-3 w-3" />
                                    <span>{task.completedSubtaskCount || 0}/{task.subtaskCount}</span>
                                </div>
                            )}

                            {task.assignee && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border cursor-help">
                                                <AvatarImage src={task.assignee.image || ""} />
                                                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                                    {task.assignee.name?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">
                                            Assigned to {task.assignee.name}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {task.dueDate && (
                                <div className={cn(
                                    "flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md border",
                                    task.dueDate < new Date() && !isCompleted
                                        ? "text-red-600 bg-red-50 border-red-200"
                                        : "text-muted-foreground border-transparent bg-muted/30"
                                )}>
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(task.dueDate), "MMM d")}</span>
                                </div>
                            )}
                        </div>

                        {/* Menu */}
                        <div className="absolute right-2 top-2 sm:static">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all text-muted-foreground/50 hover:text-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/workspace/${workspaceSlug}/tasks/${task.id}`}>Open Details</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleToggleStatus}>
                                        {isCompleted ? "Mark Incomplete" : "Mark Complete"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">Delete Task</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                        <div className="pl-6 sm:pl-10 box-border mt-1">
                            <div className="relative border-l-2 border-border/40 ml-2 pl-3 space-y-2">
                                {task.subtasks.map((subtask: any) => (
                                    <TaskCard
                                        key={subtask.id}
                                        task={subtask}
                                        workspaceId={workspaceId}
                                        workspaceSlug={workspaceSlug}
                                        view="list"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </>
        )
    }

    // Board View
    return (
        <>
            <TaskDetailModal
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                task={task}
                open={showDetail}
                onOpenChange={setShowDetail}
            />
            <div
                ref={setNodeRef}
                style={{ ...style, touchAction: "none" }}
                {...attributes}
                {...listeners}
                className={cn(
                    "group flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md relative cursor-grab active:cursor-grabbing",
                    isDragging ? "shadow-2xl ring-2 ring-primary/20 rotate-2 scale-105 z-50 cursor-grabbing" : "",
                    isCompleted && "opacity-60 bg-muted/30"
                )}
            >
                {/* Header: Title + Menu */}
                <div className="flex items-start justify-between gap-2">
                    <span
                        onClick={() => setShowDetail(true)}
                        className={cn(
                            "text-sm font-semibold line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors",
                            isCompleted && "line-through text-muted-foreground font-medium"
                        )}>
                        {task.title}
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-foreground"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setShowDetail(true)}>Open Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleToggleStatus}>
                                {isCompleted ? "Mark Incomplete" : "Mark Complete"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Linked Note Board View (Max 2) */}
                {linkedNotes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {linkedNotes.slice(0, 2).map(({ note }) => (
                            <Link
                                key={note.id}
                                href={`/workspace/${workspaceSlug}/notes/${note.id}`}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-blue-600 transition-colors bg-blue-50/50 hover:bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100/50 max-w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FileText className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[100px]">{note.title}</span>
                            </Link>
                        ))}
                        {linkedNotes.length > 2 && (
                            <span className="text-[9px] text-muted-foreground self-center pl-1">
                                +{linkedNotes.length - 2}
                            </span>
                        )}
                    </div>
                )}

                {/* Footer: Metadata */}
                <div className="flex items-center justify-between pt-1 mt-auto">
                    {/* Left: Priority Icon */}
                    <div className="flex items-center">
                        {task.priority !== Priority.NONE && priorityConfig[task.priority]?.icon && (
                            <div className={cn("flex items-center justify-center h-5 w-5 rounded-md bg-muted/30", priorityConfig[task.priority].color)} title={`Priority: ${task.priority}`}>
                                {React.createElement(priorityConfig[task.priority].icon, { className: "h-3.5 w-3.5" })}
                            </div>
                        )}
                    </div>

                    {/* Right: Date & Assignee */}
                    <div className="flex items-center gap-2">
                        {task.dueDate && (
                            <div className={cn(
                                "text-[10px] flex items-center gap-1 font-medium bg-muted/30 px-1.5 py-0.5 rounded-md",
                                task.dueDate < new Date() && !isCompleted ? "text-red-600 bg-red-50" : "text-muted-foreground"
                            )}>
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(task.dueDate), "MMM d")}</span>
                            </div>
                        )}

                        {task.assignee && (
                            <Avatar className="h-5 w-5 border border-border">
                                <AvatarImage src={task.assignee.image || ""} />
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                    {task.assignee.name?.[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
