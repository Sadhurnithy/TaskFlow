import { type Task, type User, type TaskTag, type Tag, type TaskStatus, type Priority } from "@prisma/client"

export interface TaskWithRelations extends Task {
    creator: Pick<User, "id" | "name" | "image">
    assignee: Pick<User, "id" | "name" | "image"> | null
    tags: (TaskTag & { tag: Tag })[]
    subtaskCount?: number
    completedSubtaskCount?: number
    sharedCount?: number
    subtasks?: TaskWithRelations[]
    shares?: {
        userEmail: string
        permission: "VIEW" | "EDIT"
        user: Pick<User, "id" | "name" | "image" | "email"> | null
    }[]
    notes?: { note: { id: string, title: string, coverImage: string | null } }[]
}

export interface TaskHierarchy extends TaskWithRelations {
    subtasks: TaskHierarchy[]
}

export interface TaskBoard {
    [key: string]: TaskWithRelations[]
}

export type AddTaskInput = {
    workspaceId: string
    title: string
    description?: string
    status?: TaskStatus
    priority?: Priority
    dueDate?: Date
    assigneeId?: string
    parentId?: string
    noteIds?: string[]
}

export type UpdateTaskInput = Partial<Omit<AddTaskInput, "workspaceId">>

export interface TaskFilters {
    status?: string[]
    priority?: string[]
    assigneeId?: string
    hasNoDueDate?: boolean
    isOverdue?: boolean
    tagIds?: string[]
}

export interface BulkUpdateInput {
    taskIds: string[]
    data: {
        status?: TaskStatus
        priority?: Priority
        assigneeId?: string
        dueDate?: Date | null
    }
}
