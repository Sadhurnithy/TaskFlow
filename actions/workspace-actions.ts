"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { requireAuth } from "@/lib/auth/utils"
import {
    createWorkspaceSchema,
    updateWorkspaceSchema,
    inviteMemberSchema
} from "@/lib/validators/workspace"
import {
    type CreateWorkspaceInput,
    type UpdateWorkspaceInput,
    type InviteMemberInput,
    type ActionResponse,
    type WorkspaceWithMembers,
    type WorkspaceMemberWithUser
} from "@/types/workspace"
import { Role } from "@prisma/client"
import { nanoid } from "nanoid"

// --- Helper: Generate Slug ---
function generateSlug(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const id = nanoid(6)
    return `${base}-${id}`
}

// --- Actions ---

export async function createWorkspace(input: CreateWorkspaceInput): Promise<ActionResponse<WorkspaceWithMembers>> {
    try {
        const session = await requireAuth()
        const userId = session.user?.id
        if (!userId) return { success: false, error: "Unauthorized" }

        const validated = createWorkspaceSchema.parse(input)
        const slug = generateSlug(validated.name)

        const workspace = await prisma.workspace.create({
            data: {
                name: validated.name,
                slug: slug,
                description: validated.description,
                icon: validated.icon,
                members: {
                    create: {
                        userId: userId,
                        role: "OWNER",
                        // @ts-ignore: Field exists in DB
                        lastAccessedAt: new Date(),
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, image: true }
                        }
                    }
                }
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: workspace as any } // Casting to avoid strict typing issues with specific select
    } catch (error: any) {
        console.error("Create Workspace Error:", error)
        return { success: false, error: error.message || "Failed to create workspace" }
    }
}

export async function updateWorkspace(
    workspaceId: string,
    input: UpdateWorkspaceInput
): Promise<ActionResponse> {
    try {
        const session = await requireAuth()
        const userId = session.user?.id
        if (!userId) return { success: false, error: "Unauthorized" }

        // Check permissions
        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        })

        if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
            return { success: false, error: "Insufficient permissions" }
        }

        const validated = updateWorkspaceSchema.parse(input)

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: validated,
        })

        revalidatePath(`/workspace/${workspaceId}`)
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: any) {
        console.error("Update Workspace Error:", error)
        return { success: false, error: error.message || "Failed to update workspace" }
    }
}

export async function deleteWorkspace(workspaceId: string): Promise<ActionResponse> {
    try {
        const session = await requireAuth()
        const userId = session.user?.id
        if (!userId) return { success: false, error: "Unauthorized" }

        // Check permissions (Only OWNER)
        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        })

        if (!member || member.role !== "OWNER") {
            return { success: false, error: "Only the owner can delete a workspace" }
        }

        await prisma.workspace.delete({
            where: { id: workspaceId },
        })

        revalidatePath('/dashboard')
        redirect('/dashboard')
    } catch (error: any) {
        console.error("Delete Workspace Error:", error)
        return { success: false, error: "Failed to delete workspace" }
    }
}

export async function inviteMember(
    workspaceId: string,
    input: InviteMemberInput
): Promise<ActionResponse> {
    try {
        const session = await requireAuth()
        const userId = session.user?.id
        if (!userId) return { success: false, error: "Unauthorized" }

        // Check permissions
        const inviter = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        })

        if (!inviter || (inviter.role !== "OWNER" && inviter.role !== "ADMIN")) {
            return { success: false, error: "Insufficient permissions to invite members" }
        }

        const validated = inviteMemberSchema.parse(input)

        // Find user to invite
        const invitedUser = await prisma.user.findUnique({
            where: { email: validated.email }
        })

        if (!invitedUser) {
            // Logic for sending email invitation to non-existent user would go here
            // For now, only allowing adding existing users
            return { success: false, error: "User not found. Email invitations are coming soon!" }
        }

        // Check if already a member
        const existingMember = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: invitedUser.id } }
        })

        if (existingMember) {
            return { success: false, error: "User is already a member of this workspace" }
        }

        await prisma.workspaceMember.create({
            data: {
                workspaceId,
                userId: invitedUser.id,
                role: validated.role,
            }
        })

        // Notification for invited user
        await prisma.notification.create({
            data: {
                userId: invitedUser.id,
                type: "WORKSPACE_INVITE",
                title: "New Workspace Invitation",
                message: `You have been added to a workspace as ${validated.role}`,
                link: `/workspace/${workspaceId}`,
            }
        })

        revalidatePath(`/workspace/${workspaceId}/settings`)
        return { success: true }
    } catch (error: any) {
        console.error("Invite Member Error:", error)
        return { success: false, error: error.message || "Failed to invite member" }
    }
}

export async function removeMember(
    workspaceId: string,
    memberId: string
): Promise<ActionResponse> {
    try {
        const session = await requireAuth()
        const userId = session.user?.id
        if (!userId) return { success: false, error: "Unauthorized" }

        // Check permissions
        const currentUser = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        })

        if (!currentUser || (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN")) {
            return { success: false, error: "Insufficient permissions" }
        }

        // Get target member to check role
        const targetMember = await prisma.workspaceMember.findUnique({
            where: { id: memberId } // Assuming memberId is the WorkspaceMember ID (not UserId)
        })

        if (!targetMember) return { success: false, error: "Member not found" }

        // Prevent removing OWNER
        if (targetMember.role === "OWNER") {
            return { success: false, error: "Cannot remove the workspace owner" }
        }

        // Prevent removing self (use leaveWorkspace)
        if (targetMember.userId === userId) {
            return { success: false, error: "Use 'Leave Workspace' to remove yourself" }
        }

        // Capture userId before delete for notification
        const removedUserId = targetMember.userId

        // Get workspace name for notification
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { name: true }
        })

        await prisma.workspaceMember.delete({
            where: { id: memberId }
        })

        // Send Notification
        await prisma.notification.create({
            data: {
                userId: removedUserId,
                type: "MENTION", // Generic fallback as removed_from_workspace isn't in enum yet
                title: "Removed from Workspace",
                message: `You have been removed from ${workspace?.name || 'a workspace'}`,
                read: false,
            }
        })

        revalidatePath(`/workspace/${workspaceId}/settings`)
        return { success: true }
    } catch (error: any) {
        console.error("Remove Member Error:", error)
        return { success: false, error: "Failed to remove member" }
    }
}

export async function updateMemberRole(
    workspaceId: string,
    memberId: string,
    newRole: Role
): Promise<ActionResponse> {
    try {
        const session = await requireAuth()
        const userId = session.user?.id
        if (!userId) return { success: false, error: "Unauthorized" }

        // Check permissions (Only OWNER can change roles generally, or ADMIN can change MEMBER/GUEST)
        // For simplicity following specs: "Check user is OWNER (only owner can change roles)"
        const currentUser = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        })

        if (!currentUser || currentUser.role !== "OWNER") {
            return { success: false, error: "Only the owner can manage roles" }
        }

        // Checking target exists
        const targetMember = await prisma.workspaceMember.findUnique({
            where: { id: memberId }
        })

        if (!targetMember) return { success: false, error: "Member not found" }

        if (targetMember.role === "OWNER") {
            return { success: false, error: "Cannot change role of the owner" }
        }

        // Cannot assign OWNER role via this method (use transferOwnership)
        if (newRole === "OWNER") {
            return { success: false, error: "Use 'Transfer Ownership' to assign a new owner" }
        }

        await prisma.workspaceMember.update({
            where: { id: memberId },
            data: { role: newRole }
        })

        revalidatePath(`/workspace/${workspaceId}/settings`)
        return { success: true }
    } catch (error: any) {
        console.error("Update Role Error:", error)
        return { success: false, error: "Failed to update role" }
    }
}

export async function leaveWorkspace(workspaceId: string): Promise<ActionResponse> {
    try {
        const session = await requireAuth()
        const userId = session.user?.id
        if (!userId) return { success: false, error: "Unauthorized" }

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        })

        if (!member) return { success: false, error: "Not a member" }

        if (member.role === "OWNER") {
            return { success: false, error: "Owner cannot leave. Transfer ownership or delete workspace." }
        }

        await prisma.workspaceMember.delete({
            where: {
                workspaceId_userId: { workspaceId, userId }
            }
        })

        revalidatePath('/dashboard')
        redirect('/dashboard')
    } catch (error: any) {
        console.error("Leave Workspace Error:", error)
        return { success: false, error: "Failed to leave workspace" }
    }
}

export async function transferOwnership(
    workspaceId: string,
    newOwnerId: string
): Promise<ActionResponse> {
    try {
        const session = await requireAuth()
        const userId = session.user?.id
        if (!userId) return { success: false, error: "Unauthorized" }

        // Verify current user is OWNER
        const currentOwner = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        })

        if (!currentOwner || currentOwner.role !== "OWNER") {
            return { success: false, error: "Only the owner can transfer ownership" }
        }

        // Verify new owner is a member
        const newOwnerMember = await prisma.workspaceMember.findFirst({
            where: { workspaceId, userId: newOwnerId } // findFirst to safely get by userId in access
        })

        if (!newOwnerMember) {
            return { success: false, error: "New owner must be a member of the workspace" }
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { name: true }
        })

        // Transaction: Swap roles
        await prisma.$transaction([
            prisma.workspaceMember.update({
                where: { workspaceId_userId: { workspaceId, userId } },
                data: { role: "ADMIN" }
            }),
            prisma.workspaceMember.update({
                where: { workspaceId_userId: { workspaceId, userId: newOwnerId } },
                data: { role: "OWNER" }
            }),
            // Send notification to new owner
            prisma.notification.create({
                data: {
                    userId: newOwnerId,
                    type: "MENTION", // Fallback type
                    title: "Ownership Transferred",
                    message: `You are now the owner of ${workspace?.name}`,
                }
            })
        ])

        revalidatePath(`/workspace/${workspaceId}/settings`)
        return { success: true }
    } catch (error: any) {
        console.error("Transfer Ownership Error:", error)
        return { success: false, error: "Failed to transfer ownership" }
    }
}

export async function logWorkspaceAccess(workspaceId: string): Promise<ActionResponse> {
    try {
        const session = await requireAuth()
        const userId = session.user?.id
        if (!userId) return { success: false, error: "Unauthorized" }

        await prisma.workspaceMember.update({
            where: {
                workspaceId_userId: { workspaceId, userId }
            },
            data: {
                // @ts-ignore: Field exists in DB
                lastAccessedAt: new Date()
            }
        })

        return { success: true }
    } catch (error: any) {
        // Fail silently as this is non-critical
        console.error("Log Access Error:", error)
        return { success: false }
    }
}

export async function getWorkspaceMembersAction(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    try {
        const session = await requireAuth()
        if (!session?.user) return []

        // Use the existing query
        const { getWorkspaceMembers } = await import("@/lib/db/queries/workspaces")
        return await getWorkspaceMembers(workspaceId)
    } catch (error) {
        console.error("Failed to fetch workspace members", error)
        return []
    }
}
