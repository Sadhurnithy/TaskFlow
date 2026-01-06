import { getNotesByUser, getWorkspaceNotes } from "@/lib/db/queries/notes"
import { getWorkspaceBySlug } from "@/lib/db/queries/workspaces"
import { NoteSidebar } from "@/components/notes/note-sidebar"
import { getCurrentUser } from "@/lib/auth/utils"
import { redirect } from "next/navigation"

export default async function NotesLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ workspaceSlug: string }>
}) {
    const user = await getCurrentUser()
    if (!user || !user.id) redirect("/login")

    const { workspaceSlug } = await params
    const workspace = await getWorkspaceBySlug(workspaceSlug, user.id)
    if (!workspace) redirect("/dashboard")

    // Use getWorkspaceNotes to show all workspace notes to all members
    const notes = await getWorkspaceNotes(workspace.id)

    return (
        <div className="flex h-screen overflow-hidden">
            <div className="hidden md:block">
                <NoteSidebar notes={notes} workspaceId={workspace.id} workspaceSlug={workspaceSlug} activeNoteId={null} />
            </div>
            <main className="flex-1 overflow-y-auto bg-background">
                {children}
            </main>
        </div>
    )
}

