"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateAvatar } from "@/actions/security-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FileUploader } from "@/components/shared/file-uploader"

export function AvatarUpdateDialog({ children, currentImage }: { children: React.ReactNode, currentImage?: string | null }) {
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState(currentImage || "")
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSave = () => {
        if (!url) return
        startTransition(async () => {
            const result = await updateAvatar(url)
            if (result.success) {
                toast.success("Avatar updated")
                setOpen(false)
                router.refresh()
            } else {
                toast.error("Failed to update avatar")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Profile Picture</DialogTitle>
                    <DialogDescription>
                        Upload a new profile picture.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center gap-6 py-6">
                    <FileUploader
                        onUploadComplete={(newUrl) => {
                            if (newUrl) {
                                setUrl(newUrl)
                                startTransition(async () => {
                                    const result = await updateAvatar(newUrl)
                                    if (result.success) {
                                        toast.success("Avatar updated")
                                        setOpen(false)
                                        router.refresh()
                                    } else {
                                        toast.error("Failed to update avatar")
                                    }
                                })
                            }
                        }}
                        defaultUrl={url}
                    />
                    <div className="w-full relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or using URL</span>
                        </div>
                    </div>
                    <div className="grid w-full gap-2">
                        <Label htmlFor="url">Image URL</Label>
                        <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/avatar.png" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? "Saving..." : "Save URL"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
