import { prisma } from "@/lib/db/prisma"
import { TaskStatus, Priority, Prisma } from "@prisma/client"
import { TaskWithRelations, TaskHierarchy, TaskFilters } from "@/types/task"

// Helper for standard task includes
const standardTaskInclude = {
    creator: { select: { id: true, name: true, image: true } },
    assignee: { select: { id: true, name: true, image: true } },
    tags: { include: { tag: true } },
    subtasks: {
        where: { deletedAt: null },
        include: {
            assignee: { select: { id: true, name: true, image: true } }, // Minimal for subtasks
            tags: { include: { tag: true } },
            // subtasks: { select: { status: true } } // Recursive? 3 levels deep max usually
        },
        orderBy: { position: 'asc' as const }
    },
    shares: {
        include: {
            user: { select: { id: true, name: true, image: true, email: true } }
        }
    },
    notes: { include: { note: true } }
} as Prisma.TaskInclude

// ... (omitting intermediate code for brevity in prompt, but replacing file content)

interface RawTask extends TaskWithRelations {
    subtasks: any[] // We relax this as we map it out
    // _count removed as we calculate from relations
}

const mapTask = (task: any): TaskWithRelations => {
    const subtasks = task.subtasks || []
    return {
        ...task,
        subtaskCount: subtasks.length,
        completedSubtaskCount: subtasks.filter((t: any) => t.status === TaskStatus.DONE).length,
        sharedCount: task.shares?.length || 0,
        subtasks: subtasks.map((st: any) => ({
            ...st,
            subtaskCount: 0, // Deep nesting not fetched in standard list for performance
            completedSubtaskCount: 0,
            sharedCount: 0
        }))
    }
}

export async function getWorkspaceTasks(
    workspaceId: string,
    filters?: TaskFilters,
    userId?: string, // New: for privacy
    userEmail?: string // New: for privacy
): Promise<TaskWithRelations[]> {
    const where: Prisma.TaskWhereInput = {
        workspaceId,
        deletedAt: null,
        // parentId: null, // Allow fetching all tasks for tree view construction
    }

    // STRICT PRIVACY ENFORCEMENT
    // STRICT PRIVACY ENFORCEMENT - DISABLED for Team View
    // if (userId && userEmail) {
    //     where.OR = [
    //         { createdById: userId },
    //         { assigneeId: userId },
    //         { shares: { some: { userEmail } } }
    //     ]
    // }

    if (filters) {
        if (filters.status?.length) where.status = { in: filters.status as TaskStatus[] }
        if (filters.priority?.length) where.priority = { in: filters.priority as Priority[] }
        if (filters.assigneeId) where.assigneeId = filters.assigneeId
        if (filters.hasNoDueDate) where.dueDate = null
        if (filters.isOverdue) where.dueDate = { lt: new Date() }
        if (filters.tagIds?.length) where.tags = { some: { tagId: { in: filters.tagIds } } }
    }

    if (filters?.isOverdue) {
        where.status = { not: TaskStatus.DONE }
    }

    const tasks = await prisma.task.findMany({
        where,
        include: standardTaskInclude,
        orderBy: { position: 'asc' }
    })

    return tasks.map(mapTask)
}

export async function getTaskById(taskId: string): Promise<TaskWithRelations | null> {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            ...standardTaskInclude,
            parent: { select: { id: true, title: true } }
        }
    })

    if (!task) return null

    return mapTask(task)
}

export async function getSubtasks(parentId: string): Promise<TaskWithRelations[]> {
    const tasks = await prisma.task.findMany({
        where: { parentId, deletedAt: null },
        include: standardTaskInclude,
        orderBy: { position: 'asc' }
    })

    return tasks.map(mapTask)
}

export async function getTasksByUser(userId: string, workspaceId?: string): Promise<TaskWithRelations[]> {
    const where: Prisma.TaskWhereInput = {
        OR: [
            { createdById: userId },
            { assigneeId: userId }
        ],
        deletedAt: null
    }

    if (workspaceId) where.workspaceId = workspaceId

    const tasks = await prisma.task.findMany({
        where,
        include: standardTaskInclude,
        orderBy: { updatedAt: 'desc' }
    })

    return tasks.map(mapTask)
}

export async function getTaskHierarchy(taskId: string): Promise<TaskHierarchy | null> {
    const task = await getTaskById(taskId)
    if (!task) return null

    const subtasks = await getSubtasks(taskId)
    const subtasksWithChildren = await Promise.all(
        subtasks.map(t => getTaskHierarchy(t.id))
    )

    return {
        ...task,
        subtasks: subtasksWithChildren.filter(Boolean) as TaskHierarchy[]
    }
}

export async function getOverdueTasks(workspaceId: string): Promise<TaskWithRelations[]> {
    const tasks = await prisma.task.findMany({
        where: {
            workspaceId,
            deletedAt: null,
            status: { not: TaskStatus.DONE },
            dueDate: { lt: new Date() }
        },
        include: standardTaskInclude,
        orderBy: { dueDate: 'asc' }
    })

    return tasks.map(mapTask)
}

export async function getUpcomingTasks(userId: string, days: number = 7): Promise<TaskWithRelations[]> {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + days)

    const tasks = await prisma.task.findMany({
        where: {
            OR: [{ createdById: userId }, { assigneeId: userId }],
            deletedAt: null,
            status: { not: TaskStatus.DONE },
            dueDate: {
                gte: new Date(),
                lte: nextDate
            }
        },
        include: standardTaskInclude,
        orderBy: { dueDate: 'asc' }
    })

    return tasks.map(mapTask)
}

export async function getTasksByBoard(
    workspaceId: string,
    userId?: string,
    userEmail?: string
): Promise<Record<TaskStatus, TaskWithRelations[]>> {
    const where: Prisma.TaskWhereInput = {
        workspaceId,
        deletedAt: null
    }

    // STRICT PRIVACY ENFORCEMENT
    if (userId && userEmail) {
        where.OR = [
            { createdById: userId },
            { assigneeId: userId },
            { shares: { some: { userEmail } } }
        ]
    }

    const tasks = await prisma.task.findMany({
        where,
        include: standardTaskInclude,
        orderBy: { position: 'asc' }
    })

    const initial: Record<TaskStatus, TaskWithRelations[]> = {
        [TaskStatus.TODO]: [],
        [TaskStatus.IN_PROGRESS]: [],
        [TaskStatus.IN_REVIEW]: [],
        [TaskStatus.DONE]: [],
        [TaskStatus.CANCELLED]: []
    }

    return tasks.reduce((acc, task) => {
        acc[task.status].push(mapTask(task))
        return acc
    }, initial)
}
