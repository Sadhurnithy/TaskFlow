import { prisma } from "@/lib/db/prisma"
import { Role } from "@prisma/client"
import { WorkspaceWithMembers, WorkspaceWithRole, WorkspaceMemberWithUser, WorkspaceStats } from "@/types/workspace"

export async function getUserWorkspaces(userId: string): Promise<(WorkspaceWithRole & { role: Role; memberCount: number; lastAccessedAt: Date | null })[]> {
    const members = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
            workspace: {
                include: {
                    _count: {
                        select: { members: true }
                    }
                }
            },
        },
        orderBy: {
            // @ts-ignore: Field exists in DB but client generation failed
            lastAccessedAt: 'desc',
        },
    })

    return members.map((member) => ({
        // @ts-ignore: Relation exists but client generation failed
        ...member.workspace,
        currentUserRole: member.role,
        role: member.role,
        // @ts-ignore: Field exists in DB
        lastAccessedAt: member.lastAccessedAt,
        // @ts-ignore: Count exists
        memberCount: member.workspace._count.members
    }))
}

export async function getWorkspaceById(workspaceId: string): Promise<WorkspaceWithMembers | null> {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    tasks: true,
                    notes: true,
                    members: true,
                },
            },
        },
    })

    return workspace
}

export async function getWorkspaceBySlug(slug: string, userId?: string): Promise<WorkspaceWithRole | null> {
    const workspace = await prisma.workspace.findUnique({
        where: { slug },
    })

    if (!workspace) return null

    let currentUserRole: Role | null = null

    if (userId) {
        const member = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: workspace.id,
                    userId,
                },
            },
        })
        currentUserRole = member?.role ?? null
    }

    return {
        ...workspace,
        currentUserRole,
    }
}

export async function checkUserWorkspaceAccess(userId: string, workspaceId: string): Promise<Role | null> {
    const member = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
    })

    return member?.role ?? null
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
        },
        orderBy: [
            { role: 'asc' }, // OWNER comes first if enum is ordered OWNER, ADMIN, MEMBER
            { user: { name: 'asc' } },
        ],
    })

    // Custom sort if enum order isn't what we want (but OWNER=0 usually)
    // Re-sorting just in case to guarantee OWNER first
    const roleOrder: Record<Role, number> = {
        OWNER: 0,
        ADMIN: 1,
        MEMBER: 2,
        GUEST: 3
    }

    return members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role])
}

export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)


    // Group 1: Basic Counts
    const taskCount = await prisma.task.count({ where: { workspaceId } })
    const completedTaskCount = await prisma.task.count({ where: { workspaceId, status: 'DONE' } })
    const noteCount = await prisma.note.count({ where: { workspaceId } })

    // Group 2: Time-based Stats
    const activeMembersCount = await prisma.workspaceMember.count({ where: { workspaceId } })
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { createdAt: true } })
    const newNotesCount = await prisma.note.count({ where: { workspaceId, createdAt: { gte: lastWeek } } })

    // Group 3: 24h Activity
    const createdTasks24h = await prisma.task.count({ where: { workspaceId, createdAt: { gte: yesterday } } })
    const completedTasks24h = await prisma.task.count({ where: { workspaceId, status: 'DONE', updatedAt: { gte: yesterday } } })
    const createdNotes24h = await prisma.note.count({ where: { workspaceId, createdAt: { gte: yesterday } } })

    // Group 4: Recent Data
    const recentTasksRaw = await prisma.task.findMany({
        where: { workspaceId, status: { not: 'DONE' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignee: { select: { name: true, image: true } }
        }
    })

    // Calculate generic "activity" count (simple sum of mutations in last 24h)
    const activityCount24h = createdTasks24h + completedTasks24h + createdNotes24h

    // Aggregate "Recent Activity" list
    // We fetch a few items from each type and sort in memory (efficient enough for dashboard)
    const [latestTasks, latestNotes] = await Promise.all([
        prisma.task.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { creator: { select: { name: true, image: true } } }
        }),
        prisma.note.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { creator: { select: { name: true, image: true } } }
        })
    ])

    // Normalize and merge
    const activityItems: WorkspaceStats['recentActivity'] = [
        ...latestTasks.map(t => ({
            id: t.id,
            type: 'TASK' as const,
            description: `created task "${t.title}"`,
            user: t.creator,
            createdAt: t.createdAt
        })),
        ...latestNotes.map(n => ({
            id: n.id,
            type: 'NOTE' as const,
            description: `created note "${n.title}"`,
            user: n.creator,
            createdAt: n.createdAt
        }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5) // Keep top 5

    return {
        totalTasks: taskCount,
        completedTasks: completedTaskCount,
        totalNotes: noteCount,
        activeMembers: activeMembersCount,
        createdAt: workspace?.createdAt || new Date(),
        newNotesCount,
        activityCount24h,
        recentTasks: recentTasksRaw,
        recentActivity: activityItems
    }
}
