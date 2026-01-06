import { notFound, redirect } from "next/navigation"
import { getWorkspaceBySlug } from "@/lib/db/queries/workspaces"
import { getWorkspaceTasks } from "@/lib/db/queries/tasks"
import { requireAuth } from "@/lib/auth/utils"
import { TaskListView } from "./client"

interface TasksPageProps {
    params: Promise<{
        workspaceSlug: string
    }>
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TasksPage({ params, searchParams }: TasksPageProps) {
    const { workspaceSlug } = await params
    const session = await requireAuth()

    const workspace = await getWorkspaceBySlug(workspaceSlug, session.user!.id as string)
    if (!workspace) return notFound()

    // Parse filters from searchParams if needed for server-side filtering
    // For now, fetching all relevant tasks
    const tasks = await getWorkspaceTasks(
        workspace.id,
        {}, // filters
        session.user!.id,
        session.user!.email || undefined
    )

    return (
        <div className="h-full flex flex-col">
            <TaskListView
                initialTasks={tasks}
                workspaceId={workspace.id}
                currentUserRole={workspace.currentUserRole}
            />
        </div>
    )
}
