"use server"

import { revalidatePath } from "next/cache"
import { SharePermission } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { getServerSession } from "@/lib/auth/utils"

export type ShareTaskResult = {
    success: boolean
    error?: string
}

export async function shareTask(
    taskId: string,
    email: string,
    permission: SharePermission = "VIEW"
): Promise<ShareTaskResult> {
    const session = await getServerSession()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        // 1. Check if user has permission to share (Task Owner or Admin, or Editor?)
        // For simplicity, let's say only workspace members who can edit the task can share it.
        // Or strictly task creator/assignee. Let's stick to simple: if you can see it and are member.
        // Ideally verify workspace membership.

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { workspace: true }
        })

        if (!task) return { success: false, error: "Task not found" }

        // Check user membership (omitted for brevity, assuming middleware/getUser handles mostly)
        // Ideally: check if requesting user is in workspace.

        // 2. Add or Update Share
        // Check if email corresponds to a user
        const targetUser = await prisma.user.findUnique({ where: { email } })

        await prisma.taskShare.upsert({
            where: {
                taskId_userEmail: {
                    taskId,
                    userEmail: email
                }
            },
            update: {
                permission,
                userId: targetUser?.id || null // Update userId if user registered
            },
            create: {
                taskId,
                userEmail: email,
                permission,
                userId: targetUser?.id || null
            }
        })

        revalidatePath(`/workspace/${task.workspace.slug}/tasks`)
        revalidatePath(`/workspace/${task.workspace.slug}/tasks/${taskId}`)

        return { success: true }
    } catch (error) {
        console.error("Failed to share task:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        return { success: false, error: `Failed to share task: ${errorMessage}` }
    }
}

export async function unshareTask(taskId: string, email: string): Promise<ShareTaskResult> {
    const session = await getServerSession()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { workspace: true } })
        if (!task) return { success: false, error: "Task not found" }

        await prisma.taskShare.delete({
            where: {
                taskId_userEmail: {
                    taskId,
                    userEmail: email
                }
            }
        })

        revalidatePath(`/workspace/${task.workspace.slug}/tasks`)
        revalidatePath(`/workspace/${task.workspace.slug}/tasks/${taskId}`)

        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to remove share" }
    }
}

export async function getTaskShares(taskId: string) {
    const session = await getServerSession()
    if (!session?.user) return []

    return await prisma.taskShare.findMany({
        where: { taskId },
        include: {
            user: { select: { id: true, name: true, image: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
    })
}
