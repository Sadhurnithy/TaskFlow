"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteNotePermanently } from "@/actions/note-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function DeletePermanentlyButton({ noteId }: { noteId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm("Are you sure? This action cannot be undone.")) return

        try {
            setIsLoading(true)
            const res = await deleteNotePermanently(noteId)
            if (res.success) {
                toast.success("Note permanently deleted")
                router.refresh()
            } else {
                toast.error(res.error || "Failed to delete")
            }
        } catch (error) {
            toast.error("Error deleting note")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            size="sm"
            variant="destructive"
            title="Delete Permanently"
            disabled={isLoading}
            onClick={handleDelete}
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
    )
}
