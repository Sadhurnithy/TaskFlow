import { getNoteById, getNoteVersions, getWorkspaceNotes } from "@/lib/db/queries/notes"
import { getWorkspaceBySlug } from "@/lib/db/queries/workspaces"
import { updateNote, restoreNoteVersion, deleteNote } from "@/actions/note-actions"
import { getCurrentUser } from "@/lib/auth/utils"
import { redirect, notFound } from "next/navigation"
import { NotePageHeader } from "@/components/notes/note-page-header"
import TipTapEditor from "@/components/editor/tiptap-editor"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NotePage({
    params,
}: {
    params: Promise<{ workspaceSlug: string; noteId: string }>
}) {
    const user = await getCurrentUser()
    if (!user || !user.id) redirect("/login")

    const { workspaceSlug, noteId } = await params
    const note = await getNoteById(noteId)

    // We need workspace for sidebar notes
    const workspace = await getWorkspaceBySlug(workspaceSlug, user.id)

    if (!note || !workspace) notFound()

    const notes = await getWorkspaceNotes(workspace.id)

    // Access Control
    // Allow access if:
    // 1. User is the owner
    // 2. User is explicitly shared on the note
    // 3. User is a member of the workspace (Owner, Admin, Member, Guest)
    const isOwner = note.createdById === user.id
    const userShare = note.shares?.find(s => s.userEmail === user.email)
    const hasAccess = isOwner || !!userShare || !!workspace.currentUserRole

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view this note.</p>
                <Link href={`/workspace/${workspaceSlug}/notes`}>
                    <Button variant="outline">Back to Workspace</Button>
                </Link>
            </div>
        )
    }

    let canEdit = false

    if (userShare) {
        canEdit = userShare.permission === "EDIT"
    } else if (isOwner) {
        canEdit = true
    } else {
        canEdit = ["OWNER", "ADMIN", "MEMBER"].includes(workspace.currentUserRole || "")
    }

    // Server Action wrapper for saving
    async function saveContent(content: any) {
        "use server"
        if (!canEdit) return { success: false, error: "Unauthorized" }
        return await updateNote(noteId, { content })
    }

    return (
        <main className="min-h-[100dvh] w-full bg-background md:bg-muted/5">
            <div className="w-full md:max-w-[850px] md:mx-auto md:my-8 md:bg-background md:border md:rounded-xl md:shadow-sm">
                <NotePageHeader
                    note={note}
                    onUpdate={async (data) => {
                        "use server"
                        if (!canEdit) return
                        await updateNote(noteId, data)
                    }}
                    onDelete={async () => {
                        "use server"
                        if (!isOwner) return // Only owner can delete
                        const response = await deleteNote(noteId)
                        if (response.success) {
                            redirect(`/workspace/${workspaceSlug}/notes`)
                        }
                    }}
                    canEdit={canEdit}
                    notes={notes}
                    workspaceId={workspace.id}
                    workspaceSlug={workspaceSlug}
                    currentUserRole={workspace.currentUserRole}
                />

                <div className="px-4 md:px-12 pb-20">
                    <TipTapEditor
                        initialContent={note.content}
                        note={note}
                        notes={notes}
                        workspaceId={workspace.id}
                        workspaceSlug={workspaceSlug}
                        onChange={saveContent}
                        editable={canEdit}
                    />
                </div>
            </div>
        </main>
    )
}

