"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db/prisma"
import { requireAuth } from "@/lib/auth/utils"
import { checkUserWorkspaceAccess } from "@/lib/db/queries/workspaces"
import { CreateNoteInput, UpdateNoteInput } from "@/types/note"
import { createNoteSchema, updateNoteSchema } from "@/lib/validators/note"
import { Note } from "@prisma/client"
import { deleteFromCloudinary } from "./storage-actions"
import { getCloudinaryIdsFromContent, getCloudinaryFiles } from "@/lib/utils/media-utils"

export type ActionResponse<T = null> = {
    success: boolean
    data?: T
    error?: string
}

export async function createNote(data: CreateNoteInput): Promise<ActionResponse<any>> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const inputWithUser = { ...data, createdById: userId }
    const validation = createNoteSchema.safeParse(data)
    if (!validation.success) {
        return { success: false, error: validation.error.message }
    }

    const { workspaceId, title, content, parentId, coverImage, icon, isFavorite } = validation.data

    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot create notes" }

    try {
        // Position
        const lastNote = await prisma.note.findFirst({
            where: { workspaceId, parentId: parentId || null, deletedAt: null },
            orderBy: { position: "desc" }
        })
        const position = lastNote ? lastNote.position + 1000 : 1000

        const note = await prisma.note.create({
            data: {
                workspaceId,
                title,
                content: content || { type: "doc", content: [] },
                parentId,
                coverImage,
                icon,
                isFavorite,
                position,
                createdById: userId
            }
        })

        // Initial version
        await prisma.noteVersion.create({
            data: {
                noteId: note.id,
                content: note.content || {},
                createdById: userId
            }
        })

        revalidatePath(`/workspace/${workspaceId}/notes`)
        return { success: true, data: note }
    } catch (e) {
        console.error(e)
        return { success: false, error: "Failed to create note" }
    }
}

export async function updateNote(noteId: string, data: UpdateNoteInput): Promise<ActionResponse<any>> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    // console.log(`[updateNote] Starting update for ${noteId} by ${userId}`)

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: "Note not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot edit notes" }

    try {
        // console.log(`[updateNote] Payload size roughly: ${JSON.stringify(data.content).length} bytes`)

        // Version History Logic
        const lastVersion = await prisma.noteVersion.findFirst({
            where: { noteId },
            orderBy: { createdAt: "desc" }
        })

        const now = new Date()
        const shouldSnapshot = !lastVersion || (now.getTime() - lastVersion.createdAt.getTime() > 30000)

        if (shouldSnapshot && note.content) {
            await prisma.noteVersion.create({
                data: {
                    noteId,
                    content: note.content as any,
                    createdById: userId
                }
            })
        }

        // Check for removed images (Cleanup)
        if (note.content && data.content) {
            // console.log(`[UpdateNote] Updating note ${noteId}`)
            const debugFiles = getCloudinaryFiles(data.content)
            // console.log(`[UpdateNote] Found ${debugFiles.size} files in new content:`, Array.from(debugFiles.keys()))

            const oldFiles = getCloudinaryFiles(note.content)
            const newFiles = getCloudinaryFiles(data.content)

            const removedItems: { publicId: string, resourceType: string }[] = []

            oldFiles.forEach((type, id) => {
                if (!newFiles.has(id)) {
                    removedItems.push({ publicId: id, resourceType: type })
                }
            })

            if (removedItems.length > 0) {
                console.log(`Auto-cleaning ${removedItems.length} removed files for note ${noteId}`)
                deleteFromCloudinary(removedItems).catch(e => console.error("Cleanup failed", e))
            }
        }

        const updatedNote = await prisma.note.update({
            where: { id: noteId },
            data: {
                title: data.title,
                content: data.content ?? undefined, // Only update if provided
                coverImage: data.coverImage,
                icon: data.icon,
                isPublic: data.isPublic,
                isFavorite: data.isFavorite,
                parentId: data.parentId,
                status: data.status
            }
        })

        revalidatePath(`/workspace/${note.workspaceId}/notes`)
        return { success: true, data: updatedNote }
    } catch (e) {
        console.error("[updateNote] Error:", e)
        const errorMessage = e instanceof Error ? e.message : "Unknown error"
        return { success: false, error: `Failed to update note: ${errorMessage}` }
    }
}

export async function deleteNote(noteId: string): Promise<ActionResponse> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({ where: { id: noteId }, include: { children: true } })
    if (!note) return { success: false, error: "Not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST" || role === "MEMBER") return { success: false, error: "Only Admins can delete notes" }

    // Soft delete
    await prisma.note.update({
        where: { id: noteId },
        data: { deletedAt: new Date() }
    })

    // Cascade soft delete to children (simple 1-level for now, realistically needs recursion or DB cascade if strictly enforcing)
    // For now we just mark parent as deleted. Apps usually hide children or move them.
    // The requirement says "If deleteChildren=true, cascade". We'll assume cascade for now.

    // Using updateMany for direct children
    await prisma.note.updateMany({
        where: { parentId: noteId },
        data: { deletedAt: new Date() }
    })

    revalidatePath(`/workspace/${note.workspaceId}/notes`)
    return { success: true }
}

export async function restoreNote(noteId: string): Promise<ActionResponse> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: "Not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST" || role === "MEMBER") return { success: false, error: "Only Admins can restore notes" }

    await prisma.note.update({
        where: { id: noteId },
        data: { deletedAt: null }
    })

    // Restore direct children 
    await prisma.note.updateMany({
        where: { parentId: noteId, deletedAt: { not: null } },
        data: { deletedAt: null }
    })

    revalidatePath(`/workspace/${note.workspaceId}/notes`)
    return { success: true }
}

export async function publishNote(noteId: string): Promise<ActionResponse<string>> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: "Not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot publish notes" }

    await prisma.note.update({
        where: { id: noteId },
        data: { isPublic: true }
    })

    const publicUrl = `${process.env.NEXTAUTH_URL}/public/${noteId}` // simplified for now

    revalidatePath(`/workspace/${note.workspaceId}/notes`)
    return { success: true, data: publicUrl }
}

export async function unpublishNote(noteId: string): Promise<ActionResponse> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: "Not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot unpublish notes" }

    await prisma.note.update({
        where: { id: noteId },
        data: { isPublic: false }
    })

    revalidatePath(`/workspace/${note.workspaceId}/notes`)
    return { success: true }
}

export async function moveNote(noteId: string, newParentId: string | null): Promise<ActionResponse> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: "Not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot move notes" }

    // Circular check: newParentId cannot be child of noteId
    if (newParentId) {
        if (newParentId === noteId) return { success: false, error: "Cannot move note into itself" }
        // Walk up from newParentId
        let currentId: string | null = newParentId
        while (currentId) {
            const current: { id: string, parentId: string | null } | null = await prisma.note.findUnique({
                where: { id: currentId },
                select: { id: true, parentId: true }
            })
            if (!current) break // Should not happen
            if (current.id === noteId) return { success: false, error: "Cannot move note into its own child" }
            currentId = current.parentId
        }
    }

    // Calculate position (end of new parent)
    const lastNote = await prisma.note.findFirst({
        where: { workspaceId: note.workspaceId, parentId: newParentId, deletedAt: null },
        orderBy: { position: "desc" }
    })
    const position = lastNote ? lastNote.position + 1000 : 1000

    await prisma.note.update({
        where: { id: noteId },
        data: { parentId: newParentId, position }
    })

    revalidatePath(`/workspace/${note.workspaceId}/notes`)
    return { success: true }
}

export async function duplicateNote(noteId: string, includeChildren: boolean = false): Promise<ActionResponse<any>> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: { children: includeChildren } // Basic fetch, full recursion requires logic
    })
    if (!note) return { success: false, error: "Not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot duplicate notes" }

    // Logic for deep copy is complex in one go. Let's do single level or specific recursion.
    // Simplifying: recursive function for duplication
    // We'll trust the user wants simple duplicate for now.

    async function duplicateRecursive(original: typeof note & { content: any }, parentId: string | null) {
        const newNote = await prisma.note.create({
            data: {
                workspaceId: original.workspaceId,
                title: `${original.title} (Copy)`,
                content: original.content || {},
                coverImage: original.coverImage,
                parentId: parentId,
                createdById: userId,
                position: original.position + 100 // Slightly offset
            }
        })

        // Initial version
        await prisma.noteVersion.create({
            data: {
                noteId: newNote.id,
                content: newNote.content || {},
                createdById: userId
            }
        })

        if (includeChildren && original.children) {
            // Need to fetch full children? `note.children` is only 1 level deep from inclusion
            // We need to fetch children of children... 
            // For now, limiting duplication to 1 level for simplicity unless we implement recursive fetch.
            // Or better: Just do it for direct children as per queried data.
            for (const child of original.children) {
                // Fetch full child data to get content
                const childFull = await prisma.note.findUnique({ where: { id: child.id }, include: { children: true } })
                if (childFull) {
                    await duplicateRecursive(childFull as any, newNote.id)
                }
            }
        }
        return newNote
    }

    const newNote = await duplicateRecursive(note as any, note.parentId)

    revalidatePath(`/workspace/${note.workspaceId}/notes`)
    return { success: true, data: newNote }
}

export async function restoreNoteVersion(noteId: string, versionId: string): Promise<ActionResponse> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: "Not found" }

    const version = await prisma.noteVersion.findUnique({ where: { id: versionId } })
    if (!version) return { success: false, error: "Version not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot restore note versions" }

    // Snapshot current before restore
    if (note.content) {
        await prisma.noteVersion.create({
            data: {
                noteId,
                content: note.content as any,
                createdById: userId
            }
        })
    }

    await prisma.note.update({
        where: { id: noteId },
        data: { content: version.content as any }
    })

    revalidatePath(`/workspace/${note.workspaceId}/notes`)
    return { success: true }
}

export async function shareNote(noteId: string, email: string, permission: "VIEW" | "EDIT" = "VIEW"): Promise<ActionResponse> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: "Not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot share notes" }

    // Find user by email if exists
    const targetUser = await prisma.user.findUnique({ where: { email } })

    try {
        await prisma.noteShare.upsert({
            where: {
                noteId_userEmail: {
                    noteId,
                    userEmail: email
                }
            },
            update: {
                permission,
                userId: targetUser?.id
            },
            create: {
                noteId,
                userEmail: email,
                permission,
                userId: targetUser?.id
            }
        })

        revalidatePath(`/workspace/${note.workspaceId}/notes`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, error: "Failed to share note" }
    }
}

export async function removeShare(noteId: string, email: string): Promise<ActionResponse> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: "Not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST") return { success: false, error: "Guests cannot remove shares" }

    try {
        await prisma.noteShare.delete({
            where: {
                noteId_userEmail: {
                    noteId,
                    userEmail: email
                }
            }
        })

        revalidatePath(`/workspace/${note.workspaceId}/notes`)
        return { success: true }
    } catch (e) {
        return { success: false, error: "Failed to remove share" }
    }
}

export async function deleteNotePermanently(noteId: string): Promise<ActionResponse> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: "Not found" }

    const role = await checkUserWorkspaceAccess(userId, note.workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }
    if (role === "GUEST" || role === "MEMBER") return { success: false, error: "Only Admins can delete notes" }

    try {
        // Cleanup Cloudinary Files
        if (note.content) {
            const filesToDelete = getCloudinaryFiles(note.content)
            if (filesToDelete.size > 0) {
                const items = Array.from(filesToDelete.entries()).map(([id, type]) => ({ publicId: id, resourceType: type }))
                console.log(`Cleaning up ${items.length} files for deleted note ${noteId}`)
                deleteFromCloudinary(items).catch(e => console.error("Cleanup failed", e))
            }
        }

        await prisma.note.delete({
            where: { id: noteId }
        })

        revalidatePath(`/workspace/${note.workspaceId}/notes`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, error: "Failed to delete permanently" }
    }
}




export async function getWorkspaceNotesForSelect(workspaceId: string): Promise<ActionResponse<{ id: string; title: string, coverImage: string | null }[]>> {
    const session = await requireAuth()
    const userId = session.user?.id as string

    const role = await checkUserWorkspaceAccess(userId, workspaceId)
    if (!role) return { success: false, error: "Unauthorized" }

    try {
        const notes = await prisma.note.findMany({
            where: { workspaceId, deletedAt: null },
            select: { id: true, title: true, coverImage: true },
            orderBy: { updatedAt: "desc" }
        })
        return { success: true, data: notes }
    } catch (e) {
        return { success: false, error: "Failed to fetch notes" }
    }
}
