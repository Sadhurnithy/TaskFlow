import { getWorkspaceNotes } from "@/lib/db/queries/notes"
import { getWorkspaceBySlug } from "@/lib/db/queries/workspaces"
import { getCurrentUser } from "@/lib/auth/utils"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileText, Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateNoteDialog } from "@/components/notes/create-note-dialog"

export default async function NotesDashboard({
    params,
}: {
    params: Promise<{ workspaceSlug: string }>
}) {
    const user = await getCurrentUser()
    if (!user || !user.id) redirect("/login")

    const { workspaceSlug } = await params
    const workspace = await getWorkspaceBySlug(workspaceSlug, user.id)
    if (!workspace) redirect("/dashboard")

    const notes = await getWorkspaceNotes(workspace.id)

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notes</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage and organize your thoughts.</p>
                </div>
                {/* Only show Create button if canEdit */}
                {["OWNER", "ADMIN", "MEMBER"].includes(workspace.currentUserRole || "") && (
                    <div className="hidden md:block">
                        <CreateNoteDialog
                            workspaceId={workspace.id}
                            workspaceSlug={workspaceSlug}
                            trigger={
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Note
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No notes yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first note to get started.</p>
                    {["OWNER", "ADMIN", "MEMBER"].includes(workspace.currentUserRole || "") && (
                        <CreateNoteDialog
                            workspaceId={workspace.id}
                            workspaceSlug={workspaceSlug}
                            trigger={<Button>Create Note</Button>}
                        />
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map((note) => (
                        <Link
                            key={note.id}
                            href={`/workspace/${workspaceSlug}/notes/${note.id}`}
                            className="group flex flex-col rounded-xl border bg-card hover:shadow-lg transition-all hover:border-primary/50 overflow-hidden"
                        >
                            {/* Card Cover */}
                            {note.coverImage ? (
                                <div className="h-32 w-full bg-muted relative">
                                    <img
                                        src={note.coverImage}
                                        alt={note.title || "Cover"}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ) : (
                                <div className="h-12 w-full bg-gradient-to-r from-primary/5 to-muted border-b" />
                            )}

                            <div className="p-4 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                        {note.title || "Untitled Note"}
                                    </h3>
                                    {note.isPublic && (
                                        <span className="flex-shrink-0 ml-2 text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                            Public
                                        </span>
                                    )}
                                </div>

                                <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium flex items-center">
                                        Open <FileText className="w-3 h-3 ml-1" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Mobile FAB */}
            {["OWNER", "ADMIN", "MEMBER"].includes(workspace.currentUserRole || "") && (
                <div className="md:hidden fixed bottom-6 right-6 z-50">
                    <CreateNoteDialog
                        workspaceId={workspace.id}
                        workspaceSlug={workspaceSlug}
                        trigger={
                            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-background/80 backdrop-blur-md border border-border/50 text-foreground hover:bg-background/90">
                                <Plus className="w-6 h-6" />
                            </Button>
                        }
                    />
                </div>
            )}
        </div>
    )
}
