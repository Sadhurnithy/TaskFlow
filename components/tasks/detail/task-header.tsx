"use client"

import * as React from "react"
import { format } from "date-fns"
import { CheckCircle2, MoreHorizontal, Trash2, Share2, Link as LinkIcon, Circle, Timer, Eye, Ban, Pencil, Check } from "lucide-react"
import { TaskStatus } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ShareDialog } from "@/components/tasks/share-dialog"
import { statusConfig } from "@/components/tasks/task-detail-view"
import type { TaskWithRelations } from "@/types/task"

interface TaskHeaderProps {
    task: TaskWithRelations
    title: string
    setTitle: (title: string) => void
    status: TaskStatus
    setStatus: (status: TaskStatus) => void
    canEdit: boolean
    isEditing: boolean
    setIsEditing: (isEditing: boolean) => void
    onUpdate: (data: Partial<any>) => void
    onDelete: () => void
    workspaceId: string
    workspaceSlug: string
    currentUserRole?: string | null
}

export function TaskHeader({
    task,
    title,
    setTitle,
    status,
    setStatus,
    canEdit,
    isEditing,
    setIsEditing,
    onUpdate,
    onDelete,
    workspaceId,
    workspaceSlug,
    currentUserRole
}: TaskHeaderProps) {
    const [localTitle, setLocalTitle] = React.useState(title)
    // We don't have currentUserId here to check isCreator strictly. 
    // Relying on currentUserRole being Owner/Admin as the primary check for sensitive actions like sharing.
    const isCreator = false

    React.useEffect(() => {
        setLocalTitle(title)
    }, [title])

    const handleTitleSave = () => {
        if (localTitle.trim() !== title) {
            setTitle(localTitle)
            onUpdate({ title: localTitle })
        }
        // setIsEditing(false) // Keep editing mode separate?
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleTitleSave();
            (e.currentTarget as HTMLElement).blur()
        }
    }

    const config = statusConfig[status] || statusConfig[TaskStatus.TODO]
    const StatusIcon = config.icon

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div onClick={() => !canEdit && toast.error("You do not have permission to update status")}>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canEdit}
                            className={cn(
                                "mt-1 shrink-0 rounded-full h-7 w-7 transition-all border",
                                status === TaskStatus.DONE
                                    ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600"
                                    : "bg-transparent border-muted-foreground/30 text-muted-foreground hover:border-emerald-500 hover:text-emerald-500",
                                !canEdit && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                                if (!canEdit) return
                                const newStatus = status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
                                setStatus(newStatus)
                                onUpdate({ status: newStatus })
                            }}
                        >
                            {status === TaskStatus.DONE ? <Check className="h-4 w-4" /> : <div className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="flex-1 min-w-0 group/title">
                        <Input
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleKeyDown}
                            readOnly={!canEdit}
                            onClick={() => !canEdit && toast.error("You do not have permission to edit this task")}
                            className={cn(
                                "text-2xl font-bold border-0 px-0 shadow-none h-auto rounded-none bg-transparent focus-visible:ring-0 w-full resize-none py-0 leading-tight truncate",
                                !canEdit && "cursor-not-allowed",
                                status === TaskStatus.DONE && "text-muted-foreground line-through decoration-muted-foreground/50"
                            )}
                            placeholder="Task title"
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1.5 text-[11px] text-muted-foreground/60 font-medium">
                            <span className="truncate">Created by {task.creator?.name?.split(" ")[0]}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate">{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)} // Toggle "Edit Mode" if we want a global edit state, or just focus title
                            className="hidden sm:inline-flex h-8 w-8 p-0 text-muted-foreground"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}

                    {["OWNER", "ADMIN"].includes(currentUserRole || "") && (
                        <ShareDialog
                            taskId={task.id}
                            workspaceSlug={workspaceSlug}
                            trigger={
                                <Button variant="ghost" size="sm" className="h-8 w-8 sm:w-auto p-0 sm:px-3 text-muted-foreground bg-transparent">
                                    <Share2 className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Share</span>
                                </Button>
                            }
                        />
                    )}

                    {canEdit && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    )
}
