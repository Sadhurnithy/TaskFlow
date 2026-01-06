import { notFound, redirect } from "next/navigation"
import { getWorkspaceBySlug } from "@/lib/db/queries/workspaces"
import { getTaskById } from "@/lib/db/queries/tasks"
import { requireAuth } from "@/lib/auth/utils"
import { TaskDetailView } from "@/components/tasks/task-detail-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface TaskPageProps {
    params: Promise<{
        workspaceSlug: string
        taskId: string
    }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TaskPage({ params, searchParams }: TaskPageProps) {
    const { workspaceSlug, taskId } = await params
    const { view } = await searchParams
    const session = await requireAuth()

    const workspace = await getWorkspaceBySlug(workspaceSlug, session.user!.id as string)
    if (!workspace) return notFound()

    const task = await getTaskById(taskId)
    if (!task || task.workspaceId !== workspace.id) return notFound()

    // Check permissions
    let canEdit = false

    // ... (Permission logic) ...

    const isCreator = task.createdById === session.user!.id
    const isAssignee = task.assigneeId === session.user!.id

    // Check for explicit share record
    const userShare = task.shares?.find((s: any) => s.userEmail === session.user!.email)

    // STRICT PRIVACY:
    // Allow access if:
    // 1. User is the creator
    // 2. User is the assignee
    // 3. User is explicitly shared on the task
    // 4. User is a member of the workspace (Owner, Admin, Member, Guest)
    const hasAccess = isCreator || isAssignee || !!userShare || !!workspace.currentUserRole

    if (!hasAccess) {
        return notFound()
    }

    // Edit permission logic
    // Edit permission logic
    if (userShare) {
        canEdit = userShare.permission === "EDIT"
    } else if (isCreator || isAssignee) {
        canEdit = true
    } else {
        // Role-based fallback
        canEdit = ["OWNER", "ADMIN", "MEMBER"].includes(workspace.currentUserRole || "")
    }

    // If explicit view mode is requested via URL, force read-only
    if (view === "true") {
        canEdit = false
    }

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="h-12 border-b flex items-center px-4 bg-background z-10 sticky top-0 md:static">
                <Link href={`/workspace/${workspaceSlug}/tasks`} passHref>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Tasks
                    </Button>
                </Link>
            </div>

            <div className="flex-1 overflow-hidden">
                <TaskDetailView
                    task={task}
                    workspaceId={workspace.id}
                    workspaceSlug={workspaceSlug}
                    canEdit={canEdit}
                    currentUserRole={workspace.currentUserRole}
                />
            </div>
        </div>
    )
}
