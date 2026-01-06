import { type Workspace, type WorkspaceMember, type User, type Role } from "@prisma/client"

export type { Role }

export interface WorkspaceWithMembers extends Workspace {
    members: WorkspaceMemberWithUser[]
    _count?: {
        tasks: number
        notes: number
        members: number
    }
}

export interface WorkspaceWithRole extends Workspace {
    currentUserRole: Role | null
}

export interface WorkspaceMemberWithUser extends WorkspaceMember {
    user: Pick<User, "id" | "name" | "email" | "image">
}

export interface ActivityItem {
    id: string
    type: 'TASK' | 'NOTE' | 'COMMENT'
    description: string
    user: { name: string | null; image: string | null }
    createdAt: Date
}

export interface WorkspaceStats {
    totalTasks: number
    completedTasks: number
    totalNotes: number
    activeMembers: number
    createdAt: Date
    newNotesCount: number // Notes created in last 7 days
    activityCount24h: number // Actions in last 24h
    recentTasks: {
        id: string
        title: string
        status: string
        priority: string
        assignee: { name: string | null; image: string | null } | null
    }[]
    recentActivity: ActivityItem[]
}

// Action Inputs
export interface CreateWorkspaceInput {
    name: string
    icon?: string
    description?: string
}

export interface UpdateWorkspaceInput {
    name?: string
    icon?: string
    description?: string
}

export interface InviteMemberInput {
    email: string
    role: Role
}

// Action Responses
export type ActionResponse<T = null> = {
    success: boolean
    data?: T
    error?: string
}
