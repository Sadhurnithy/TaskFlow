import { z } from "zod"
import { Role } from "@prisma/client"

export const slugSchema = z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, alphanumeric, and can contain hyphens")

export const createWorkspaceSchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
    icon: z.string().optional(),
    description: z.string().max(200, "Description must be less than 200 characters").optional(),
})

export const updateWorkspaceSchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters").optional(),
    icon: z.string().optional(),
    description: z.string().max(200, "Description must be less than 200 characters").optional(),
})

export const inviteMemberSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.nativeEnum(Role),
})
