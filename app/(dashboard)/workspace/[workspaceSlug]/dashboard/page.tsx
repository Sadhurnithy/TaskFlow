import Link from "next/link"
import { notFound } from "next/navigation"
import { getWorkspaceBySlug, getWorkspaceStats } from "@/lib/db/queries/workspaces"
import { requireAuth } from "@/lib/auth/utils"
// import { DashboardClient } from "./client" // For log access side effect
import { LogAccess } from "./_components/log-access"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, FileText, Users, Activity, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardPageProps {
    params: Promise<{
        workspaceSlug: string
    }>
}

import { CreateNoteDialog } from "@/components/notes/create-note-dialog"
import { CreateTaskForm } from "@/components/tasks/create-task-form"

// ... existing imports

export default async function DashboardPage({ params }: DashboardPageProps) {
    const session = await requireAuth()
    const { workspaceSlug } = await params
    const userId = session?.user?.id!

    const workspace = await getWorkspaceBySlug(workspaceSlug, userId)
    if (!workspace) notFound()

    const stats = await getWorkspaceStats(workspace.id)

    return (
        <div className="p-6 space-y-8">
            <LogAccess workspaceId={workspace.id} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview for {workspace.name}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Only show Create buttons if canEdit */}
                    {["OWNER", "ADMIN", "MEMBER"].includes(workspace.currentUserRole || "") && (
                        <>
                            <CreateNoteDialog
                                workspaceId={workspace.id}
                                workspaceSlug={workspaceSlug}
                                trigger={
                                    <Button variant="outline" size="sm">
                                        <FileText className="mr-2 h-4 w-4" />
                                        New Note
                                    </Button>
                                }
                            />
                            <CreateTaskForm
                                workspaceId={workspace.id}
                                trigger={
                                    <Button size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Task
                                    </Button>
                                }
                            />
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTasks}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.completedTasks} completed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Notes</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalNotes}</div>
                        <p className="text-xs text-muted-foreground">
                            +{stats.newNotesCount} from last week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeMembers}</div>
                        <p className="text-xs text-muted-foreground">
                            Active in this workspace
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Activity</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.activityCount24h}</div>
                        <p className="text-xs text-muted-foreground">
                            New actions since yesterday
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentTasks.length > 0 ? (
                            <div className="space-y-1">
                                {stats.recentTasks.map((task) => (
                                    <Link
                                        key={task.id}
                                        href={`/workspace/${workspaceSlug}/tasks?taskId=${task.id}`}
                                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-2 w-2 rounded-full shrink-0 ${task.priority === 'URGENT' ? 'bg-red-500' :
                                                task.priority === 'HIGH' ? 'bg-orange-500' :
                                                    task.priority === 'MEDIUM' ? 'bg-yellow-500' :
                                                        'bg-blue-500'
                                                }`} />
                                            <span className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">{task.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {task.assignee && (
                                                <Avatar className="h-5 w-5 border">
                                                    <AvatarImage src={task.assignee.image || ""} />
                                                    <AvatarFallback className="text-[9px]">
                                                        {task.assignee.name?.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground uppercase font-semibold">
                                                {task.status.replace("_", " ")}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                No active tasks. Create one to get started!
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Team Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentActivity.length > 0 ? (
                            <div className="space-y-6 relative pl-2">
                                {/* Vertical line for timeline effect */}
                                <div className="absolute top-2 bottom-2 left-[19px] w-px bg-border" />

                                {stats.recentActivity.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm relative">
                                        <Avatar className="h-8 w-8 border-2 border-background z-10">
                                            <AvatarImage src={item.user?.image || ""} />
                                            <AvatarFallback className="bg-muted text-xs">
                                                {item.user?.name?.substring(0, 2).toUpperCase() || "??"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col gap-0.5 pt-0.5 min-w-0">
                                            <p className="leading-snug text-sm">
                                                <span className="font-semibold text-foreground">{item.user?.name || 'User'}</span>
                                                <span className="text-muted-foreground"> {item.description}</span>
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                No recent activity.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
