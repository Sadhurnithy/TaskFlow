"use server"

import { requireAuth } from "@/lib/auth/utils"
import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const UpdateUserSchema = z.object({
    name: z.string().min(2).max(50),
})

export async function updateUserProfile(data: { name: string }) {
    const session = await requireAuth()
    const userId = session.user?.id

    if (!userId) {
        throw new Error("Unauthorized")
    }

    const result = UpdateUserSchema.safeParse(data)
    if (!result.success) {
        throw new Error("Invalid input")
    }

    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { name: result.data.name },
        })

        revalidatePath("/settings")
        return { success: true, user }
    } catch (error) {
        console.error("Failed to update user:", error)
        return { success: false, error: "Failed to update profile" }
    }
}
