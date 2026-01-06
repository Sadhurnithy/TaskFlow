"use client"

import * as React from "react"
import { Check, Copy, Globe, Mail, Plus, Trash, User, X } from "lucide-react"
import { toast } from "sonner"
import { SharePermission } from "@prisma/client"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import { shareTask, unshareTask, getTaskShares } from "@/actions/share-actions"
import { cn } from "@/lib/utils"

interface ShareDialogProps {
    taskId: string
    workspaceSlug: string
    trigger?: React.ReactNode
}

export function ShareDialog({ taskId, workspaceSlug, trigger }: ShareDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [email, setEmail] = React.useState("")
    const [permission, setPermission] = React.useState<SharePermission>("VIEW")
    const [isLoading, setIsLoading] = React.useState(false)
    const [shares, setShares] = React.useState<any[]>([])

    // Fetch shares when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            const fetchShares = async () => {
                const result = await getTaskShares(taskId)
                setShares(result)
            }
            fetchShares()
        }
    }, [isOpen, taskId])

    const handleShare = async () => {
        if (!email) return
        setIsLoading(true)
        try {
            const result = await shareTask(taskId, email, permission)
            if (result.success) {
                toast.success("Invited successfully")
                setEmail("")
                // Refresh list
                const updated = await getTaskShares(taskId)
                setShares(updated)
            } else {
                toast.error(result.error || "Failed to invite")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUnshare = async (emailToRemove: string) => {
        try {
            const result = await unshareTask(taskId, emailToRemove)
            if (result.success) {
                toast.success("Removed access")
                setShares(shares.filter(s => s.userEmail !== emailToRemove))
            } else {
                toast.error("Failed to remove")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const copyLink = () => {
        const url = `${window.location.origin}/workspace/${workspaceSlug}/tasks/${taskId}?view=true`
        navigator.clipboard.writeText(url)
        toast.success("View-only link copied")
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <SharePermissionIcon className="h-4 w-4" />
                        Share
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Task</DialogTitle>
                    <DialogDescription>
                        Invite others to view or edit this task.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Invite Section */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleShare()}
                        />
                        <Select
                            value={permission}
                            onValueChange={(v) => setPermission(v as SharePermission)}
                        >
                            <SelectTrigger className="w-[110px] bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="VIEW">Can view</SelectItem>
                                <SelectItem value="EDIT">Can edit</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleShare}
                            disabled={isLoading || !email}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isLoading ? "..." : "Invite"}
                        </Button>
                    </div>

                    <Separator />

                    {/* Shared List */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">People with access</h4>
                        <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                                {shares.length === 0 && (
                                    <div className="text-sm text-muted-foreground text-center py-4">
                                        No one has been invited yet.
                                    </div>
                                )}
                                {shares.map((share) => (
                                    <div key={share.id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={share.user?.image} />
                                                <AvatarFallback>
                                                    {share.user?.name?.[0] || share.userEmail[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5 leading-none">
                                                <div className="text-sm font-medium truncate">
                                                    {share.user?.name || share.userEmail}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {share.userEmail}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded-full capitalize">
                                                {share.permission.toLowerCase()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                                onClick={() => handleUnshare(share.userEmail)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between items-center bg-muted/50 -mx-6 -mb-6 p-4 mt-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        <span>Link grants access to collaborators</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={copyLink} className="gap-2 bg-white border hover:bg-slate-50 text-slate-700">
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SharePermissionIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" x2="12" y1="2" y2="15" />
        </svg>
    )
}
