import 'server-only'
import { auth } from "./config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"

export async function getServerSession() {
    try {
        return await auth()
    } catch (e) {
        console.error("Auth Error:", e)
        return null
    }
}

export async function requireAuth() {
    const session = await getServerSession()
    if (!session?.user) {
        redirect("/login?error=SessionExpired")
    }
    return session
}

export async function getUserWorkspaces() {
    const session = await requireAuth()
    if (!session?.user?.id) return []

    const members = await prisma.workspaceMember.findMany({
        where: { userId: session.user.id },
        include: { workspace: true },
    })

    return members.map((m) => ({
        ...m.workspace,
        role: m.role,
    }))
}

export async function getCurrentUser() {
    const session = await getServerSession()
    return session?.user
}
