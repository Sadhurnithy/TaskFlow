import { z } from "zod"
import { NoteStatus } from "@prisma/client"

// Helper for validating TipTap JSON roughly
const tipTapJsonSchema = z.record(z.string(), z.any()).optional().nullable()

export const createNoteSchema = z.object({
    workspaceId: z.string().cuid(),
    title: z.string().min(1, "Title is required").max(500),
    content: tipTapJsonSchema,
    coverImage: z.string().url().optional().nullable(),
    icon: z.string().optional().nullable(),
    isFavorite: z.boolean().optional(),
    parentId: z.string().cuid().optional().nullable(),
})

export const updateNoteSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    content: tipTapJsonSchema,
    coverImage: z.string().url().optional().nullable(),
    icon: z.string().optional().nullable(),
    parentId: z.string().cuid().optional().nullable(),
    isPublic: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
    status: z.nativeEnum(NoteStatus).optional(),
})
