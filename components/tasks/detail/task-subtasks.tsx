"use client"

import * as React from "react"
import { Check, Plus, Trash2, GripVertical } from "lucide-react"
import { TaskStatus } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
// import { Checkbox } from "@/components/ui/checkbox" // Using custom checkbox style

interface TaskSubtasksProps {
    subtasks: any[]
    setSubtasks: React.Dispatch<React.SetStateAction<any[]>>
    canEdit: boolean
    onCreateSubtask: (title: string) => Promise<void>
    onToggleSubtask: (id: string, currentStatus: TaskStatus) => Promise<void>
    onDeleteSubtask: (id: string) => Promise<void>
}

export function TaskSubtasks({
    subtasks,
    setSubtasks,
    canEdit,
    onCreateSubtask,
    onToggleSubtask,
    onDeleteSubtask
}: TaskSubtasksProps) {
    const [newTitle, setNewTitle] = React.useState("")
    const [isCreating, setIsCreating] = React.useState(false)

    const completedCount = subtasks.filter(t => t.status === TaskStatus.DONE).length
    const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0

    const handleCreate = async () => {
        if (!newTitle.trim()) return
        setIsCreating(true)
        await onCreateSubtask(newTitle)
        setNewTitle("")
        setIsCreating(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleCreate()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/80">Subtasks</h3>
                {subtasks.length > 0 && (
                    <span className="text-xs text-muted-foreground font-medium">{completedCount}/{subtasks.length}</span>
                )}
            </div>

            {subtasks.length > 0 && (
                <Progress value={progress} className="h-1.5" />
            )}

            <div className="space-y-1">
                {subtasks.map(subtask => (
                    <div
                        key={subtask.id}
                        className="group flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/70 transition-colors"
                    >
                        {/* Drag Handle (Visual only for now) */}
                        <div className="opacity-0 group-hover:opacity-30 cursor-grab">
                            <GripVertical className="h-3.5 w-3.5" />
                        </div>

                        <div onClick={() => !canEdit && toast.error("You do not have permission to update subtasks")}>
                            <button
                                onClick={() => canEdit && onToggleSubtask(subtask.id, subtask.status)}
                                disabled={!canEdit}
                                className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded-sm border transition-all",
                                    subtask.status === TaskStatus.DONE
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/40 text-transparent hover:border-primary/50",
                                    !canEdit && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <Check className="h-3 w-3" />
                            </button>
                        </div>

                        <span className={cn(
                            "flex-1 text-sm truncate transition-all decoration-muted-foreground/50",
                            subtask.status === TaskStatus.DONE && "line-through text-muted-foreground"
                        )}>
                            {subtask.title}
                        </span>

                        {canEdit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteSubtask(subtask.id)}
                                className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            {canEdit && (
                <div className="flex items-center gap-3 px-2 mt-2">
                    <div className="w-4 flex justify-center opacity-30">
                        <Plus className="h-4 w-4" />
                    </div>
                    <div className="flex-1 flex gap-2">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add subtask..."
                            className="border-0 shadow-none focus-visible:ring-0 px-0 h-9 bg-transparent placeholder:text-muted-foreground/60 text-sm flex-1"
                        />
                        {newTitle.trim().length > 0 && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="h-8 px-3 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                            >
                                Add
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
