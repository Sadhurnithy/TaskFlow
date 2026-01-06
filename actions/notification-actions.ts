"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth/config"

export async function markNotificationRead(notificationId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.notification.update({
            where: {
                id: notificationId,
                userId: session.user.id
            },
            data: {
                read: true
            }
        })

        revalidatePath("/workspace/[slug]/inbox", "page") // Generic revalidate
        return { success: true }
    } catch (error) {
        return { error: "Failed to mark notification as read" }
    }
}

export async function markAllNotificationsRead() {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                read: false
            },
            data: {
                read: true
            }
        })

        revalidatePath("/workspace/[slug]/inbox", "page")
        return { success: true }
    } catch (error) {
        return { error: "Failed to mark all as read" }
    }
}
