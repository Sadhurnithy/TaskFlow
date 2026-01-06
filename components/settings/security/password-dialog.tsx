"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updatePassword } from "@/actions/security-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function PasswordUpdateDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [isPending, startTransition] = useTransition()

    const handleSave = () => {
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        if (password !== confirm) {
            toast.error("Passwords do not match")
            return
        }

        startTransition(async () => {
            const result = await updatePassword(password)
            if (result.success) {
                toast.success("Password updated")
                setOpen(false)
                setPassword("")
                setConfirm("")
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
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Enter your new password below.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm">Confirm Password</Label>
                        <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? "Updating..." : "Update Password"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
