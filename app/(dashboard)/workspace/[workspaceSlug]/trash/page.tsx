import { getCurrentUser } from "@/lib/auth/utils"
import { redirect, notFound } from "next/navigation"
import { getWorkspaceNotes } from "@/lib/db/queries/notes"
import { getWorkspaceBySlug } from "@/lib/db/queries/workspaces"
import { restoreNote, deleteNotePermanently } from "@/actions/note-actions"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FileText, RefreshCcw, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DeletePermanentlyButton } from "@/components/notes/trash-actions"

export default async function TrashPage({
    params,
}: {
    params: Promise<{ workspaceSlug: string }>
}) {
    const user = await getCurrentUser()
    if (!user) redirect("/login")

    // Await params as it's a Promise in Next.js 15
    const { workspaceSlug } = await params

    const workspace = await getWorkspaceBySlug(workspaceSlug, user.id)
    if (!workspace) notFound()

    // Fetch all notes including archived/deleted and filter
    const notes = await getWorkspaceNotes(workspace.id, { includeArchived: true })
    const deletedNotes = notes.filter((n: any) => n.deletedAt)

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="mb-8">
                <Link href={`/workspace/${workspaceSlug}/notes`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors w-fit p-1 -ml-1 rounded-md hover:bg-muted">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Notes
                </Link>
            </div>

            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="p-2 bg-muted rounded-full">
                    <Trash2 className="w-5 h-5 text-muted-foreground" />
                </span>
                Trash
            </h1>

            {deletedNotes.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                    Trash is empty
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Deleted At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deletedNotes.map((note: any) => (
                                <TableRow key={note.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            {note.title || "Untitled"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {note.deletedAt ? new Date(note.deletedAt).toLocaleDateString() : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <form action={async () => {
                                                "use server"
                                                await restoreNote(note.id)
                                            }}>
                                                <Button size="sm" variant="outline" title="Restore">
                                                    <RefreshCcw className="w-4 h-4 mr-1" /> Restore
                                                </Button>
                                            </form>

                                            <DeletePermanentlyButton noteId={note.id} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
