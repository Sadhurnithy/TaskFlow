"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { createNote } from "@/actions/note-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"

interface CreateNoteDialogProps {
    workspaceId: string
    workspaceSlug: string
    parentId?: string
    trigger?: React.ReactNode
}

export function CreateNoteDialog({ workspaceId, workspaceSlug, parentId, trigger }: CreateNoteDialogProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleCreate = async () => {
        try {
            setIsLoading(true)
            const response = await createNote({
                workspaceId,
                title: title || "Untitled Note",
                parentId,
                createdById: "" // handled by server
            })

            if (!response.success || !response.data) {
                throw new Error(response.error || "Failed to create note")
            }

            const note = response.data as any // Cast because ActionResponse generic might be loose

            toast.success("Note created")
            setOpen(false)
            setTitle("")
            router.push(`/workspace/${workspaceSlug}/notes/${note.id}`)
            router.refresh()
        } catch (error) {
            toast.error("Failed to create note")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Note
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                    <DialogDescription>
                        Start a fresh page for your thoughts.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Project Specs"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isLoading ? "Creating..." : "Create Note"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
