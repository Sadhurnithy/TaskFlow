"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, UserPlus, Shield, User, Eye } from "lucide-react"
import { useParams } from "next/navigation"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { inviteMemberSchema } from "@/lib/validators/workspace"
import { inviteMember } from "@/actions/workspace-actions"
import type { InviteMemberInput } from "@/types/workspace"
import { Role } from "@prisma/client"

export function InviteMemberDialog() {
    const [open, setOpen] = React.useState(false)
    const [isPending, setIsPending] = React.useState(false)
    const params = useParams()
    // Assuming we are inside [workspaceSlug] context, but the action needs workspaceId.
    // We need to pass workspaceId to this component if we can't derive it.
    // Or fetch it. Ideally, Server Component passes workspaceId to this Client Component.
    // For now, let's assume this component receives workspaceId as prop. 
    // Wait, I can't restart whole hierarchy. 
    // I will make it accept workspaceId as prop.

    // NOTE: This component needs to be used where workspaceId is known.
}

interface InviteMemberDialogProps {
    workspaceId: string
}

export function InviteMemberDialogWithId({ workspaceId }: InviteMemberDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [isPending, setIsPending] = React.useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<InviteMemberInput>({
        resolver: zodResolver(inviteMemberSchema),
        defaultValues: {
            email: "",
            role: Role.MEMBER,
        },
    })

    const onSubmit = async (data: InviteMemberInput) => {
        setIsPending(true)
        try {
            const result = await inviteMember(workspaceId, data)

            if (result.success) {
                toast.success("Member invited successfully")
                setOpen(false)
                reset()
            } else {
                toast.error(result.error || "Failed to invite member")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border shadow-sm backdrop-blur-sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-background/80 backdrop-blur-xl border border-primary/20 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Invite a new member to join your workspace.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="font-semibold">Email Address</Label>
                        <Input
                            id="email"
                            placeholder="colleague@example.com"
                            type="email"
                            className="bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role" className="font-semibold">Role</Label>
                        <Select
                            defaultValue={Role.MEMBER}
                            onValueChange={(val) => setValue("role", val as Role)}
                        >
                            <SelectTrigger className="bg-background/50 border-primary/20 focus:ring-primary/30">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-primary/20">
                                <SelectItem value={Role.ADMIN}>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-indigo-500" />
                                        <span>
                                            <span className="font-medium block">Admin</span>
                                            <span className="text-xs text-muted-foreground block">Can manage settings and members</span>
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value={Role.MEMBER}>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-blue-500" />
                                        <span>
                                            <span className="font-medium block">Member</span>
                                            <span className="text-xs text-muted-foreground block">Can create and edit content</span>
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value={Role.GUEST}>
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-slate-500" />
                                        <span>
                                            <span className="font-medium block">Guest</span>
                                            <span className="text-xs text-muted-foreground block">View only access</span>
                                        </span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role.message}</p>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invite
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
