import { prisma } from "@/lib/db/prisma"
import { TaskStatus, Priority, Prisma } from "@prisma/client"
import { NoteWithRelations, NoteFilters } from "@/types/note"

export async function getWorkspaceNotes(
    workspaceId: string,
    filters: NoteFilters = {}
): Promise<NoteWithRelations[]> {
    const { searchQuery, parentId, includeArchived } = filters

    const where: Prisma.NoteWhereInput = {
        workspaceId,
        deletedAt: includeArchived ? undefined : null,
    }

    if (searchQuery) {
        where.OR = [
            { title: { contains: searchQuery, mode: "insensitive" } },
            // Searching content (JSON) is trickier with Prisma, usually requires raw query or text search extension.
            // keeping it simple for now: valid mostly for title.
        ]
    }

    if (parentId !== undefined) {
        where.parentId = parentId
    }

    const notes = await prisma.note.findMany({
        where,
        include: {
            creator: {
                select: { id: true, name: true, image: true }
            },
            tags: {
                include: { tag: true }
            },
            _count: {
                select: { children: true, versions: true }
            }
        },
        orderBy: {
            updatedAt: "desc" // changing to updated recently
        }
    })

    return notes as NoteWithRelations[]
}

export async function getNoteById(noteId: string): Promise<NoteWithRelations | null> {
    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: {
            creator: {
                select: { id: true, name: true, image: true }
            },
            tags: {
                include: { tag: true }
            },
            versions: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    creator: { select: { id: true, name: true, image: true } }
                }
            },
            _count: {
                select: { children: true, versions: true }
            },
            parent: {
                select: { id: true, title: true }
            },
            shares: true
        }
    })

    if (!note) return null
    return note as unknown as NoteWithRelations
}

// Get hierarchy (simple recursive fetch for now or just children)
export async function getNoteChildren(noteId: string): Promise<NoteWithRelations[]> {
    const notes = await prisma.note.findMany({
        where: { parentId: noteId, deletedAt: null },
        include: {
            creator: { select: { id: true, name: true, image: true } },
            tags: { include: { tag: true } },
            _count: { select: { children: true, versions: true } }
        },
        orderBy: { position: "asc" }
    })
    return notes as NoteWithRelations[]
}

export async function getNoteVersions(noteId: string) {
    return prisma.noteVersion.findMany({
        where: { noteId },
        orderBy: { createdAt: "desc" },
        include: {
            creator: { select: { id: true, name: true, image: true } }
        }
    })
}

export async function getPublicNote(noteId: string) {
    const note = await getNoteById(noteId)
    if (note && note.isPublic) return note
    return null
}

export async function getNoteBreadcrumb(noteId: string): Promise<Pick<NoteWithRelations, "id" | "title">[]> {
    // Simple recursive fetch up the tree
    const breadcrumbs: Pick<NoteWithRelations, "id" | "title">[] = []
    let currentId = noteId

    while (currentId) {
        const note = await prisma.note.findUnique({
            where: { id: currentId },
            select: { id: true, title: true, parentId: true }
        })
        if (!note) break
        breadcrumbs.unshift({ id: note.id, title: note.title })
        if (!note.parentId) break
        currentId = note.parentId
    }
    return breadcrumbs
}

// Recursive function to build tree
async function buildNoteTree(noteId: string): Promise<any> { // Typing recursive tree usually tricky
    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: { children: true }
    })
    if (!note) return null

    const childrenWithRecursion = await Promise.all(
        note.children.map(child => buildNoteTree(child.id))
    )

    return {
        ...note,
        children: childrenWithRecursion
    }
}

export async function getNotesByUser(userId: string, workspaceId?: string) {
    const where: any = {
        createdById: userId,
        deletedAt: null
    }

    if (workspaceId) {
        where.workspaceId = workspaceId
    }

    const notes = await prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
            tags: true,
            _count: {
                select: { children: true, versions: true, comments: true }
            }
        }
    })

    return notes
}

export async function getNoteHierarchy(rootNoteId: string) {
    return buildNoteTree(rootNoteId)
}
