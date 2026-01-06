"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Shield, ShieldAlert, Trash, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InviteMemberDialogWithId } from "@/components/workspace/invite-member-dialog"
import { removeMember, updateMemberRole } from "@/actions/workspace-actions"
import { Role } from "@prisma/client"

interface MembersListProps {
    workspaceId: string
    members: any[] // Using exact DB type is tricky on client with date objects, handling as any or generic object
    currentUserRole: Role | null
    currentUserId: string
}

export function MembersList({ workspaceId, members, currentUserRole, currentUserId }: MembersListProps) {
    const router = useRouter()

    const handleRemove = async (memberId: string) => {
        const result = await removeMember(workspaceId, memberId)
        if (result.success) {
            toast.success("Member removed")
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    const handleRoleChange = async (memberId: string, newRole: Role) => {
        const result = await updateMemberRole(workspaceId, memberId, newRole)
        if (result.success) {
            toast.success("Role updated")
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Team Members</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage who has access to this workspace.
                    </p>
                </div>
                {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
                    <InviteMemberDialogWithId workspaceId={workspaceId} />
                )}
            </div>

            <div className="border rounded-lg divide-y">
                {members.map((member) => (
                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={member.user.image} />
                                <AvatarFallback>{member.user.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm flex items-center gap-2">
                                    {member.user.name}
                                    {member.user.id === currentUserId && <span className="text-xs text-muted-foreground">(You)</span>}
                                </p>
                                <p className="text-xs text-muted-foreground">{member.user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                {member.role === "OWNER" && <ShieldAlert className="h-3 w-3 text-orange-500" />}
                                {member.role === "ADMIN" && <Shield className="h-3 w-3 text-blue-500" />}
                                {member.role === "MEMBER" && <User className="h-3 w-3" />}
                                {member.role}
                            </div>

                            {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && member.role !== "OWNER" && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {currentUserRole === "OWNER" && (
                                            <>
                                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, "ADMIN")}>
                                                    Make Admin
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, "MEMBER")}>
                                                    Make Member
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, "GUEST")}>
                                                    Make Guest
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleRemove(member.id)}>
                                            <Trash className="mr-2 h-4 w-4" />
                                            Remove Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
