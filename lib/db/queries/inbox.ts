
import { prisma as db } from "@/lib/db/prisma"
import { TaskStatus, Priority } from "@prisma/client"
import { addDays } from "date-fns"
import { unstable_cache } from "next/cache"


// We need a specific type for Inbox items that includes everything from TaskWithRelations plus the "reason"
import type { TaskWithRelations } from "@/types/task" // Assuming this exists

export type InboxReason =
    | "assigned_to_you"
    | "due_soon"
    | "overdue"
    | "in_review"
    | "unprocessed"
    | "snoozed"
    | "unknown"

export type InboxItem = TaskWithRelations & {
    inboxReason: InboxReason
}

// Re-using the include from tasks query if possible, or defining it here
const inboxTaskInclude = {
    assignee: true,
    creator: true,
    tags: { include: { tag: true } },
    notes: { include: { note: true } },
    subtasks: true,
    shares: { include: { user: true } },
    workspace: true,
}

export async function getInboxItems(workspaceId: string, userId: string): Promise<InboxItem[]> {
    if (!userId || !workspaceId) return []

    // Calculate dates
    const now = new Date()
    const twoDaysFromNow = addDays(now, 2)

    // Fetch all potentially relevant tasks in one go to minimize DB calls, then filter/classify in memory?
    // Or simpler: fetch raw tasks that match ANY of the criteria.

    // Criteria:
    // 1. Assigned to me (active)
    // 2. Created by me AND (Unassigned OR Priority=None OR No Due Date) -> "Unprocessed"
    // 3. Status is IN_REVIEW (and I'm creator or assignee) - (Assignee covered by #1)

    const tasks = await db.task.findMany({
        where: {
            workspaceId,
            isArchived: false,
            status: {
                notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] // IN_REVIEW stays in Inbox
            },
            OR: [
                // 1. Assigned to me (AND due soon or no due date)
                {
                    assigneeId: userId,
                    OR: [
                        { dueDate: null },
                        { dueDate: { lte: twoDaysFromNow } }
                    ]
                },
                // 2. Unprocessed (Created by me)
                {
                    createdById: userId,
                    OR: [
                        { assigneeId: null },
                        { priority: Priority.NONE },
                        { dueDate: null }
                    ]
                },
                // 3. In Review (Created by me, regardless of due date?)
                // Let's say In Review is always relevant.
                {
                    createdById: userId,
                    status: TaskStatus.IN_REVIEW
                }
            ]
        },
        include: inboxTaskInclude,
        orderBy: { updatedAt: 'desc' }
    })

    // Post-process to determine the "Reason"
    // Valid priorities for reasons: Overdue > Due Soon > In Review > Unprocessed > Assigned

    const inboxItems: InboxItem[] = tasks.map((task: any) => {
        let reason: InboxReason = "assigned_to_you" // Default

        const isAssignedToMe = task.assigneeId === userId
        const isCreatedByMe = task.createdById === userId

        // Check Overdue/Due Soon
        if (task.dueDate) {
            const due = new Date(task.dueDate)
            if (due < now) {
                return { ...task, inboxReason: "overdue" }
            }
            if (due <= twoDaysFromNow) {
                return { ...task, inboxReason: "due_soon" }
            }
        }

        // Check In Review
        if (task.status === TaskStatus.IN_REVIEW) {
            return { ...task, inboxReason: "in_review" }
        }

        // Check Unprocessed
        // Only if created by me and has missing info
        if (isCreatedByMe) {
            const missingInfo = !task.assigneeId || task.priority === Priority.NONE || !task.dueDate
            if (missingInfo) {
                // But if I am assigned to it, maybe "Assigned" is strong enough? 
                // The prompt requested Unprocessed to catch tasks "missing key details".
                // Let's deprioritize this if it's already assigned to me? 
                // Actually prompt says "newly created or unprocessed...".
                return { ...task, inboxReason: "unprocessed" }
            }
        }

        // Default fallbacks
        if (isAssignedToMe) {
            reason = "assigned_to_you"
        } else {
            // Should theoretically be caught by Unprocessed, but safety net
            reason = "unknown"
        }

        return { ...task, inboxReason: reason }
    })

    // Sort by urgency? Or keep updatedAt?
    // Prompt says "group items by Today, Upcoming...".
    // We'll leave sorting to the component or do basic time sorting here.
    return inboxItems.sort((a, b) => {
        // Custom sort: Overdue first, then default to UpdatedAt
        if (a.inboxReason === 'overdue' && b.inboxReason !== 'overdue') return -1
        if (b.inboxReason === 'overdue' && a.inboxReason !== 'overdue') return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
}

export async function getInboxCount(workspaceId: string, userId: string): Promise<number> {
    if (!userId || !workspaceId) return 0

    const now = new Date()
    const twoDaysFromNow = addDays(now, 2)

    // Using a simpler query for count to be faster
    // Count items matching any of the criteria
    const count = await db.task.count({
        where: {
            workspaceId,
            isArchived: false,
            status: {
                notIn: [TaskStatus.DONE, TaskStatus.CANCELLED]
            },
            OR: [
                { assigneeId: userId },
                {
                    createdById: userId,
                    OR: [
                        { assigneeId: null },
                        { priority: Priority.NONE },
                        { dueDate: null }
                    ]
                },
                {
                    createdById: userId,
                    status: TaskStatus.IN_REVIEW
                }
            ]
        }
    })

    return count
}

export async function getInboxNotifications(workspaceId: string, userId: string): Promise<any[]> {
    if (!userId) return []

    // Fetch unread notifications for the user
    // Ideally we filter by workspace but filtered by user is okay for now if global
    // Schema has no workspaceId on Notification, so just by user
    const notifications = await db.notification.findMany({
        where: {
            userId,
            read: false
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
    return notifications
}

export async function getSnoozedItems(workspaceId: string, userId: string): Promise<InboxItem[]> {
    if (!userId || !workspaceId) return []

    const now = new Date()
    const twoDaysFromNow = addDays(now, 2)

    // "Snoozed" or Future tasks:
    // 1. Assigned to me OR Created by me (unfinished)
    // 2. Due Date > 2 days from now
    // 3. Status NOT Done/Cancelled
    const tasks = await db.task.findMany({
        where: {
            workspaceId,
            isArchived: false,
            status: {
                notIn: [TaskStatus.DONE, TaskStatus.CANCELLED, TaskStatus.IN_REVIEW]
            },
            OR: [
                { assigneeId: userId },
                { createdById: userId }
            ],
            dueDate: {
                gt: twoDaysFromNow
            }
        },
        include: inboxTaskInclude,
        orderBy: { dueDate: 'asc' }
    })

    // Map to InboxItem with "snoozed" reason
    return tasks.map((task: any) => ({
        ...task,
        inboxReason: "snoozed"
    }))
}
