import { z } from "zod"
import { TaskStatus, Priority } from "@prisma/client"

export const createTaskSchema = z.object({
    workspaceId: z.string().cuid(),
    title: z.string().min(1, "Title is required").max(500),
    description: z.string().max(5000).optional(),
    status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
    priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
    dueDate: z.date().optional(),
    assigneeId: z.string().cuid().optional(),
    parentId: z.string().cuid().optional(),
    noteIds: z.array(z.string().cuid()).optional(),
})

export const updateTaskSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(Priority).optional(),
    dueDate: z.date().optional().nullable(),
    assigneeId: z.string().cuid().optional().nullable(),
    noteIds: z.array(z.string().cuid()).optional(),
})

export const bulkUpdateTasksSchema = z.object({
    taskIds: z.array(z.string().cuid()),
    data: z.object({
        status: z.nativeEnum(TaskStatus).optional(),
        priority: z.nativeEnum(Priority).optional(),
        assigneeId: z.string().cuid().optional().nullable(),
        dueDate: z.date().optional().nullable(),
    })
})

export const taskFiltersSchema = z.object({
    status: z.array(z.nativeEnum(TaskStatus)).optional(),
    priority: z.array(z.nativeEnum(Priority)).optional(),
    assigneeId: z.string().cuid().optional(),
    hasNoDueDate: z.boolean().optional(),
    isOverdue: z.boolean().optional(),
    tagIds: z.array(z.string().cuid()).optional(),
})
