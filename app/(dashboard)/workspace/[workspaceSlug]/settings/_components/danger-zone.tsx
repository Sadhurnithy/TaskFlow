"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
import { deleteWorkspace, leaveWorkspace } from "@/actions/workspace-actions"

interface DangerZoneProps {
    workspace: {
        id: string
        name: string
        currentUserRole: string | null
    }
}

export function DangerZone({ workspace }: DangerZoneProps) {
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [leaveOpen, setLeaveOpen] = useState(false)
    const [confirmName, setConfirmName] = useState("")
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (confirmName !== workspace.name) return
        setIsPending(true)
        try {
            // Wait, deleteWorkspace redirects but returns void/response?
            // The action returns { success: true } OR redirects.
            // The action redirects on success.
            await deleteWorkspace(workspace.id)
            router.push('/dashboard')
        } catch (error) {
            toast.error("Failed to delete workspace")
        } finally {
            setIsPending(false)
        }
    }

    const handleLeave = async () => {
        setIsPending(true)
        try {
            await leaveWorkspace(workspace.id)
            // Redirects to dashboard
        } catch (error) {
            toast.error("Failed to leave workspace")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-2">
                <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                    Irreversible and destructive actions.
                </p>
            </div>

            <div className="border border-red-200 rounded-lg divide-y divide-red-100 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900">
                {workspace.currentUserRole === "OWNER" ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                        <div>
                            <p className="font-medium text-sm">Delete Workspace</p>
                            <p className="text-xs text-muted-foreground">Permanently remove this workspace and all its data.</p>
                        </div>
                        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">Delete Workspace</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete the
                                        <span className="font-bold text-foreground mx-1">{workspace.name}</span>
                                        workspace and remove all associated data.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-2 py-4">
                                    <Label>Type workspace name to confirm</Label>
                                    <Input
                                        value={confirmName}
                                        onChange={(e) => setConfirmName(e.target.value)}
                                        placeholder={workspace.name}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={confirmName !== workspace.name || isPending}
                                    >
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Delete Forever
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                        <div>
                            <p className="font-medium text-sm">Leave Workspace</p>
                            <p className="text-xs text-muted-foreground">Revoke your access to this workspace.</p>
                        </div>
                        <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">Leave Workspace</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Leave Workspace?</DialogTitle>
                                    <DialogDescription>
                                        You will lose access to all projects and tasks in this workspace.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setLeaveOpen(false)}>Cancel</Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleLeave}
                                        disabled={isPending}
                                    >
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirm Leave
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </div>
    )
}
