import { Note, User, Tag, NoteTag, NoteVersion, NoteShare, NoteStatus } from "@prisma/client"

export interface NoteWithRelations extends Note {
    creator: Pick<User, "id" | "name" | "image">
    tags: (NoteTag & { tag: Tag })[]
    versions?: NoteVersion[]
    children?: NoteWithRelations[]
    shares: NoteShare[]
    _count?: {
        children: number
        versions: number
    }
}

export type CreateNoteInput = {
    workspaceId: string
    title: string
    content?: any // Json
    coverImage?: string
    icon?: string
    isFavorite?: boolean
    parentId?: string
    createdById: string
}

export type UpdateNoteInput = Partial<Omit<CreateNoteInput, "workspaceId" | "createdById" | "parentId">> & {
    isPublic?: boolean
    parentId?: string
    icon?: string
    isFavorite?: boolean
    status?: NoteStatus
}

export interface NoteFilters {
    searchQuery?: string
    tagIds?: string[]
    parentId?: string | null // null for root notes
    isPublic?: boolean
    includeArchived?: boolean // deletedAt check
}
