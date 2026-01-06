"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db/prisma"
import { requireAuth } from "@/lib/auth/utils"
import { checkUserWorkspaceAccess } from "@/lib/db/queries/workspaces"
import { AddTaskInput, UpdateTaskInput, BulkUpdateInput } from "@/types/task"
import { createTaskSchema, updateTaskSchema, bulkUpdateTasksSchema } from "@/lib/validators/task"
import { TaskStatus } from "@prisma/client"

export type ActionResponse<T = null> = {
    success: boolean
    data?: T
    error?: string
}

export async function createTask(data: AddTaskInput): Promise<ActionResponse<any>> {
    const session = await requireAuth()
    const userId = session.user!.id as string

    const validation = createTaskSchema.safeParse(data)
    if (!validation.success) {
        return { success: false, error: validation.error.message }
    }

    const { workspaceId, title, description, status, priority, dueDate, assigneeId, parentId, noteIds } = validation.data

    // Check permission
    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot create tasks" }

    try {
        // Calculate position (append to end of list)
        const lastTask = await prisma.task.findFirst({
            where: { workspaceId, parentId, deletedAt: null },
            orderBy: { position: "desc" }
        })
        const position = lastTask ? lastTask.position + 1000 : 1000

        // Create Task
        const task = await prisma.task.create({
            data: {
                workspaceId,
                title,
                description,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                assigneeId,
                parentId,
                position,
                createdById: userId,
                notes: noteIds?.length ? { create: noteIds.map(noteId => ({ noteId })) } : undefined
            },
            include: { creator: true, assignee: true, tags: { include: { tag: true } }, notes: { include: { note: true } } }
        })

        revalidatePath(`/workspace/${data.workspaceId}/tasks`)
        return { success: true, data: task }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Failed to create task" }
    }
}

export async function updateTask(taskId: string, data: UpdateTaskInput & { workspaceId: string }): Promise<ActionResponse<any>> {
    const session = await requireAuth()
    const userId = session.user!.id as string

    const validation = updateTaskSchema.safeParse(data)
    if (!validation.success) {
        return { success: false, error: validation.error.message }
    }

    const { workspaceId, noteIds } = data
    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot edit tasks" }

    try {
        // Additional check: verify task belongs to workspace
        const existingTask = await prisma.task.findUnique({ where: { id: taskId } })
        if (!existingTask || existingTask.workspaceId !== workspaceId) {
            return { success: false, error: "Task not found" }
        }

        const updates: any = { ...validation.data }
        delete updates.noteIds // Handle separately

        // Auto-set completedAt
        if (updates.status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE) {
            updates.completedAt = new Date()
        } else if (updates?.status && updates.status !== TaskStatus.DONE) {
            updates.completedAt = null
        }

        // Handle Note Linking
        if (noteIds !== undefined) {
            // 1. Remove existing links
            await prisma.taskNoteLink.deleteMany({ where: { taskId } })

            // 2. Add new links if present
            if (noteIds.length > 0) {
                await prisma.taskNoteLink.createMany({
                    data: noteIds.map(noteId => ({ taskId, noteId }))
                })
            }
        }

        const task = await prisma.task.update({
            where: { id: taskId },
            data: updates,
            include: { creator: true, assignee: true, tags: { include: { tag: true } }, notes: { include: { note: true } } }
        })

        revalidatePath(`/workspace/${workspaceId}/tasks`)
        return { success: true, data: task }

    } catch (error) {
        return { success: false, error: "Failed to update task" }
    }
}

export async function deleteTask(taskId: string, workspaceId: string, deleteSubtasks: boolean = false): Promise<ActionResponse<null>> {
    const session = await requireAuth()
    const userId = session.user!.id as string

    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST" || role === "MEMBER") return { success: false, error: "Only Admins can delete tasks" }

    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } })
        if (!task || task.workspaceId !== workspaceId) return { success: false, error: "Not found" }

        const now = new Date()

        if (deleteSubtasks) {
            // Soft delete task and all subtasks
            await prisma.task.update({
                where: { id: taskId },
                data: { deletedAt: now }
            })

            // Mark children
            await prisma.task.updateMany({
                where: { parentId: taskId },
                data: { deletedAt: now }
            })
        } else {
            // Move subtasks up to parent
            await prisma.task.updateMany({
                where: { parentId: taskId },
                data: { parentId: task.parentId } // Move to grandparent
            })

            // Soft delete task
            await prisma.task.update({
                where: { id: taskId },
                data: { deletedAt: now }
            })
        }

        revalidatePath(`/workspace/${workspaceId}/tasks`)
        // Revalidate inbox implicitly? No, paths mismatch.
        // We rely on client router.refresh() for Inbox context.
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete task" }
    }
}

export async function restoreTask(taskId: string, workspaceId: string): Promise<ActionResponse<null>> {
    const session = await requireAuth()
    const userId = session.user!.id as string

    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST" || role === "MEMBER") return { success: false, error: "Only Admins can restore tasks" }

    try {
        await prisma.task.update({
            where: { id: taskId },
            data: { deletedAt: null }
        })
        revalidatePath(`/workspace/${workspaceId}/tasks`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Restoration failed" }
    }
}

export async function reorderTask(
    taskId: string,
    workspaceId: string,
    newPosition: number,
    newParentId?: string | null
): Promise<ActionResponse<null>> {
    const session = await requireAuth()
    const userId = session.user!.id as string

    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot reorder tasks" }

    try {
        // 1. Circular check if newParentId provided
        if (newParentId) {
            if (newParentId === taskId) return { success: false, error: "Cannot move task inside itself" }
        }

        await prisma.task.update({
            where: { id: taskId },
            data: {
                position: newPosition,
                parentId: newParentId
            }
        })

        revalidatePath(`/workspace/${workspaceId}/tasks`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Reorder failed" }
    }
}

export async function bulkUpdateTasks(workspaceId: string, input: BulkUpdateInput): Promise<ActionResponse<null>> {
    const session = await requireAuth()
    const userId = session.user!.id as string

    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot edit tasks" }

    const validation = bulkUpdateTasksSchema.safeParse(input)
    if (!validation.success) return { success: false, error: validation.error.message }

    const { taskIds, data } = validation.data

    try {
        await prisma.task.updateMany({
            where: {
                id: { in: taskIds },
                workspaceId
            },
            data
        })

        revalidatePath(`/workspace/${workspaceId}/tasks`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Bulk update failed" }
    }
}

export async function toggleTaskStatus(taskId: string, workspaceId: string): Promise<ActionResponse<null>> {
    const session = await requireAuth()
    const userId = session.user!.id as string

    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot edit tasks" }

    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } })
        if (!task || task.workspaceId !== workspaceId) return { success: false, error: "Not found" }

        const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
        const completedAt = newStatus === TaskStatus.DONE ? new Date() : null

        await prisma.task.update({
            where: { id: taskId },
            data: { status: newStatus, completedAt }
        })

        revalidatePath(`/workspace/${workspaceId}/tasks`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to toggle status" }
    }
}

export async function duplicateTask(taskId: string, workspaceId: string, includeSubtasks: boolean = false): Promise<ActionResponse<any>> {
    const session = await requireAuth()
    const userId = session.user!.id as string

    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot create tasks" }

    try {
        const sourceTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: { tags: true }
        })
        if (!sourceTask || sourceTask.workspaceId !== workspaceId) return { success: false, error: "Not found" }

        const newTask = await prisma.task.create({
            data: {
                workspaceId,
                title: `${sourceTask.title} (Copy)`,
                description: sourceTask.description,
                status: TaskStatus.TODO,
                priority: sourceTask.priority,
                createdById: userId,
                parentId: sourceTask.parentId,
                position: sourceTask.position + 1
            }
        })

        if (sourceTask.tags.length) {
            await prisma.taskTag.createMany({
                data: sourceTask.tags.map(t => ({ taskId: newTask.id, tagId: t.tagId }))
            })
        }

        revalidatePath(`/workspace/${workspaceId}/tasks`)
        return { success: true, data: newTask }

    } catch (error) {
        return { success: false, error: "Duplicate failed" }
    }
}

export async function moveTaskToWorkspace(taskId: string, targetWorkspaceId: string): Promise<ActionResponse<null>> {
    const session = await requireAuth()
    const userId = session.user!.id as string

    const roleTarget = await checkUserWorkspaceAccess(userId, targetWorkspaceId)
    if (!roleTarget) return { success: false, error: "Unauthorized" }
    if (roleTarget === "GUEST") return { success: false, error: "Guests cannot move tasks" }

    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } })
        if (!task) return { success: false, error: "Not found" }

        const roleSource = await checkUserWorkspaceAccess(userId, task.workspaceId)
        if (!roleSource) return { success: false, error: "Unauthorized" }

        const updateRecursive = async (tid: string) => {
            await prisma.task.update({
                where: { id: tid },
                data: {
                    workspaceId: targetWorkspaceId,
                    assigneeId: null,
                    tags: { set: [] }
                }
            })

            const children = await prisma.task.findMany({ where: { parentId: tid } })
            for (const child of children) {
                await updateRecursive(child.id)
            }
        }

        await updateRecursive(taskId)

        revalidatePath(`/workspace/${targetWorkspaceId}/tasks`)
        return { success: true }
        return { success: true }
    } catch (error) {
        return { success: false, error: "Move failed" }
    }
}

export async function getSubtasks(taskId: string): Promise<ActionResponse<any[]>> {
    const session = await requireAuth()

    try {
        const subtasks = await prisma.task.findMany({
            where: {
                parentId: taskId,
                deletedAt: null
            },
            include: {
                assignee: true,
                creator: true,
                tags: { include: { tag: true } }
            },
            orderBy: { position: 'asc' }
        })
        return { success: true, data: subtasks }
    } catch (error) {
        return { success: false, error: "Failed to fetch subtasks" }
    }
}
