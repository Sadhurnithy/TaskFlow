"use client"

import * as React from "react"
import { Calendar as CalendarIcon, CheckCircle2, Timer, Eye, Ban, Minus, Circle, ArrowDown, Equal, ArrowUp, AlertCircle } from "lucide-react"
import { Priority, TaskStatus } from "@prisma/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { updateTask, deleteTask, createTask, getSubtasks, toggleTaskStatus } from "@/actions/task-actions"
import { getWorkspaceNotesForSelect } from "@/actions/note-actions"
import type { TaskWithRelations } from "@/types/task"

// Sub-components
import { TaskHeader } from "@/components/tasks/detail/task-header"
import { TaskDescription } from "@/components/tasks/detail/task-description"
import { TaskSubtasks } from "@/components/tasks/detail/task-subtasks"
import { TaskSidebar } from "@/components/tasks/detail/task-sidebar"

// Configs exported for use in sub-components
export const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    [TaskStatus.TODO]: { label: "To Do", icon: Circle, color: "text-slate-500", bg: "bg-slate-500/10" },
    [TaskStatus.IN_PROGRESS]: { label: "In Progress", icon: Timer, color: "text-blue-500", bg: "bg-blue-500/10" },
    [TaskStatus.IN_REVIEW]: { label: "In Review", icon: Eye, color: "text-purple-500", bg: "bg-purple-500/10" },
    [TaskStatus.DONE]: { label: "Done", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    [TaskStatus.CANCELLED]: { label: "Cancelled", icon: Ban, color: "text-red-500", bg: "bg-red-500/10" },
}

export const priorityConfig: Record<Priority, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    [Priority.LOW]: { label: "Low", icon: ArrowDown, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" },
    [Priority.MEDIUM]: { label: "Medium", icon: Equal, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
    [Priority.HIGH]: { label: "High", icon: ArrowUp, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" },
    [Priority.URGENT]: { label: "Urgent", icon: AlertCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
    [Priority.NONE]: { label: "None", icon: Minus, color: "text-muted-foreground", bg: "bg-muted" },
}

interface TaskDetailViewProps {
    task: TaskWithRelations
    workspaceId: string
    workspaceSlug: string
    onDelete?: () => void
    isModal?: boolean
    canEdit?: boolean
    currentUserRole?: string | null
}

import { RoleBadge } from "@/components/workspace/role-badge"

export function TaskDetailView({ task, workspaceId, workspaceSlug, onDelete, isModal = false, canEdit = true, currentUserRole }: TaskDetailViewProps) {
    const router = useRouter()

    // State
    const [isEditing, setIsEditing] = React.useState(isModal)
    const [title, setTitle] = React.useState(task.title)
    const [description, setDescription] = React.useState(task.description || "")
    const [status, setStatus] = React.useState(task.status)
    const [priority, setPriority] = React.useState(task.priority)
    const [dueDate, setDueDate] = React.useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined)

    const [subtasks, setSubtasks] = React.useState<any[]>([])
    // const [loadingSubtasks, setLoadingSubtasks] = React.useState(false) // Can use specific loading state if needed
    const [availableNotes, setAvailableNotes] = React.useState<{ id: string; title: string }[]>([])

    // Sync from Props
    React.useEffect(() => {
        setTitle(task.title)
        setDescription(task.description || "")
        setStatus(task.status)
        setPriority(task.priority)
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)

        // Fetch subtasks
        getSubtasks(task.id).then(res => {
            if (res.success && res.data) {
                setSubtasks(res.data)
            }
        })

        // Fetch notes
        getWorkspaceNotesForSelect(workspaceId).then(res => {
            if (res.success && res.data) {
                setAvailableNotes(res.data)
            }
        })
    }, [task, workspaceId])

    // Actions
    const handleUpdate = async (data: Partial<any>) => {
        try {
            const updatePayload: any = { ...data, workspaceId }
            if (data.description === null) updatePayload.description = ""

            await updateTask(task.id, updatePayload)
            toast.success("Saved")
            router.refresh()
        } catch (error) {
            toast.error("Failed to save")
        }
    }

    const handleDelete = async () => {
        const confirm = window.confirm("Are you sure you want to delete this task?")
        if (!confirm) return

        await deleteTask(task.id, workspaceId)
        if (onDelete) {
            onDelete()
        } else {
            router.back()
        }
        toast.success("Task deleted")
    }

    // Subtask Actions (Passed down)
    const handleCreateSubtask = async (title: string) => {
        const tempId = Math.random().toString()
        const optimisticSubtask = { id: tempId, title, status: TaskStatus.TODO, parentId: task.id }

        setSubtasks(prev => [...prev, optimisticSubtask])

        const res = await createTask({
            workspaceId,
            parentId: task.id,
            title,
            status: TaskStatus.TODO
        })

        if (res.success && res.data) {
            setSubtasks(prev => prev.map(t => t.id === tempId ? res.data : t))
            router.refresh()
        } else {
            setSubtasks(prev => prev.filter(t => t.id !== tempId))
            toast.error("Failed to create subtask")
        }
    }

    const handleToggleSubtask = async (id: string, currentStatus: TaskStatus) => {
        const newStatus = currentStatus === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
        setSubtasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
        await toggleTaskStatus(id, workspaceId)
        router.refresh()
    }

    const handleDeleteSubtask = async (id: string) => {
        setSubtasks(prev => prev.filter(t => t.id !== id))
        await deleteTask(id, workspaceId)
        router.refresh()
    }


    return (
        <div className={cn(
            "flex flex-col md:flex-row bg-background w-full overflow-hidden", // Prevent double scrolling
            !isModal && "h-full"
        )}>
            {/* LEFT: Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
                <div className="p-6 md:p-8 md:max-w-3xl mx-auto w-full space-y-8 pb-20 md:pb-8">
                    {/* Header */}
                    <TaskHeader
                        task={task}
                        title={title}
                        setTitle={setTitle}
                        status={status}
                        setStatus={setStatus}
                        canEdit={canEdit}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        workspaceId={workspaceId}
                        workspaceSlug={workspaceSlug}
                        currentUserRole={currentUserRole}
                    />

                    {currentUserRole && (
                        <div className="flex justify-end md:hidden">
                            <RoleBadge role={currentUserRole} />
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Description */}
                        <div className="space-y-2">
                            {/* <h3 className="text-sm font-semibold text-foreground/80">Description</h3> */}
                            <TaskDescription
                                description={description}
                                setDescription={setDescription}
                                canEdit={canEdit}
                                onUpdate={handleUpdate}
                            />
                        </div>

                        {/* Subtasks */}
                        <div className="pt-2">
                            <TaskSubtasks
                                subtasks={subtasks}
                                setSubtasks={setSubtasks}
                                canEdit={canEdit}
                                onCreateSubtask={handleCreateSubtask}
                                onToggleSubtask={handleToggleSubtask}
                                onDeleteSubtask={handleDeleteSubtask}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Sidebar */}
            <div className={cn(
                "border-l bg-muted/5 p-6 flex-shrink-0 space-y-7 overflow-y-auto",
                isModal ? "w-80" : "w-full md:w-80 border-t md:border-t-0 md:border-l h-auto md:h-full pb-20 md:pb-6"
            )}>
                {currentUserRole && (
                    <div className="hidden md:flex mb-4 justify-end">
                        <RoleBadge role={currentUserRole} />
                    </div>
                )}
                <TaskSidebar
                    task={task}
                    workspaceId={workspaceId}
                    status={status}
                    setStatus={setStatus}
                    priority={priority}
                    setPriority={setPriority}
                    dueDate={dueDate}
                    setDueDate={setDueDate}
                    canEdit={canEdit}
                    onUpdate={handleUpdate}
                    availableNotes={availableNotes}
                    workspaceSlug={workspaceSlug}
                />
            </div>
        </div>
    )
}
