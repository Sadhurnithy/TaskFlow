"use client"

import { cn } from "@/lib/utils"
import {
    ChevronRight, ChevronDown, FileText, Plus,
    MoreHorizontal, Trash2, FilePlus, Loader2
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CreateNoteDialog } from "./create-note-dialog"
import { createNote, deleteNote } from "@/actions/note-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Recursive Tree Item Component
const NoteTreeItem = ({ note, depth = 0, activeId, workspaceSlug, workspaceId }: any) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const router = useRouter()

    // Auto-expand if active note is a child (could be implemented if we know ancestry, keeping simple for now)

    const hasChildren = note.children && note.children.length > 0
    const isActive = note.id === activeId

    const handleCreateChild = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            setIsCreating(true)
            const response = await createNote({
                workspaceId,
                title: "Untitled Page",
                parentId: note.id,
                createdById: ""
            })

            if (response.success && response.data) {
                toast.success("Page created")
                setIsExpanded(true)
                router.push(`/workspace/${workspaceSlug}/notes/${response.data.id}`)
                router.refresh()
            } else {
                toast.error(response.error || "Failed to create page")
            }
        } catch (error) {
            toast.error("Error creating page")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // Simple confirm for now
        if (!confirm("Are you sure you want to move this note to trash?")) return

        try {
            const res = await deleteNote(note.id)
            if (res.success) {
                toast.success("Moved to Trash")
                router.refresh()
            } else {
                toast.error("Failed to delete")
            }
        } catch (error) {
            toast.error("Error deleting note")
        }
    }

    return (
        <div>
            <div
                className={cn(
                    "group flex items-center py-1.5 px-2 rounded-md hover:bg-accent/50 cursor-pointer text-sm text-muted-foreground transition-colors min-h-[32px]",
                    isActive && "bg-accent text-accent-foreground font-medium"
                )}
                style={{ paddingLeft: `${(depth * 12) + 8}px` }}
            >
                <button
                    onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded) }}
                    className={cn(
                        "mr-1 p-0.5 rounded-sm hover:bg-muted-foreground/20 text-muted-foreground/50 hover:text-foreground transition-colors",
                        !hasChildren && "opacity-0 pointer-events-none"
                    )}
                >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                <Link href={`/workspace/${workspaceSlug}/notes/${note.id}`} className="flex-1 flex items-center gap-2 truncate overflow-hidden">
                    <FileText className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="truncate">{note.title || "Untitled"}</span>
                </Link>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                    <button
                        className="p-1 hover:bg-muted-foreground/20 rounded text-muted-foreground hover:text-foreground transition-colors"
                        onClick={handleCreateChild}
                        title="Add child page"
                    >
                        {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="p-1 hover:bg-muted-foreground/20 rounded text-muted-foreground hover:text-foreground transition-colors data-[state=open]:bg-muted-foreground/20"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}
                            >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="right" className="w-40">
                            <DropdownMenuItem onClick={handleCreateChild}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Page
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div>
                    {note.children.map((child: any) => (
                        <NoteTreeItem
                            key={child.id}
                            note={child}
                            depth={depth + 1}
                            activeId={activeId}
                            workspaceSlug={workspaceSlug}
                            workspaceId={workspaceId}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function NoteSidebar({ notes, workspaceId, workspaceSlug, activeNoteId, className }: any) {
    return (
        <div className={cn("w-64 border-r h-screen bg-muted/5 flex flex-col", className)}>
            <div className="p-3 border-b flex items-center justify-between">
                <span className="font-semibold text-sm pl-2">Notes</span>
                <CreateNoteDialog
                    workspaceId={workspaceId}
                    workspaceSlug={workspaceSlug}
                    trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <FilePlus className="w-4 h-4" />
                        </Button>
                    }
                />
            </div>

            <ScrollArea className="flex-1 py-2">
                <div className="px-2 space-y-0.5">
                    {notes.map((note: any) => (
                        <NoteTreeItem
                            key={note.id}
                            note={note}
                            activeId={activeNoteId}
                            workspaceSlug={workspaceSlug}
                            workspaceId={workspaceId}
                        />
                    ))}
                    {notes.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-4">
                            No notes yet. Create one!
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-3 border-t mt-auto">
                <Link href={`/workspace/${workspaceSlug}/trash`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Trash
                    </Button>
                </Link>
            </div>
        </div>
    )
}

