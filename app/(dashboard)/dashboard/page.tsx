import { requireAuth } from "@/lib/auth/utils"
// Note: importing from lib/db/queries/workspaces because getUserWorkspaces is a query not auth util
import { getUserWorkspaces } from "@/lib/db/queries/workspaces"
import { UserMenu } from "@/components/shared/user-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Layout, Clock, ArrowRight, Command } from "lucide-react"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const session = await requireAuth()

    if (!session.user) {
        return null
    }

    const workspaces = await getUserWorkspaces(session.user.id!)
    const user = session.user

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
                    {/* Consistent Login Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
                            <Command className="h-4 w-4" />
                        </div>
                        <span className="font-bold tracking-tight text-lg">TaskNotes</span>
                    </div>
                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        <UserMenu user={user} />
                    </div>
                </div>
            </header>

            <main className="container max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 flex-1">

                {/* Hero / Title */}
                <div className="flex flex-col gap-4 mb-8 sm:mb-10 border-b pb-6 sm:pb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm sm:text-lg">
                            Select a workspace to manage your tasks and notes.
                        </p>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Existing Workspaces */}
                    {workspaces.map((workspace) => (
                        <Link
                            key={workspace.id}
                            href={`/workspace/${workspace.slug}/dashboard`}
                            className="group outline-none cursor-pointer"
                        >
                            <Card className="h-full flex flex-col transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-xl border group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                                        {workspace.icon || "⚡"}
                                    </div>
                                    <Badge variant="outline" className="font-medium text-[10px] uppercase tracking-wider">
                                        {workspace.role}
                                    </Badge>
                                </CardHeader>

                                <CardContent className="p-6 pt-4 flex-1">
                                    <h3 className="font-semibold text-xl tracking-tight mb-2 group-hover:text-primary transition-colors">
                                        {workspace.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {workspace.description || "No description provided."}
                                    </p>
                                </CardContent>

                                <CardFooter className="p-4 bg-muted/40 border-t flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">
                                            {workspace.lastAccessedAt ? new Date(workspace.lastAccessedAt).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            }) : 'Never accessed'}
                                        </span>
                                    </div>

                                    {/* Member Count */}
                                    {/* @ts-ignore: memberCount exists on the extended type now */}
                                    {workspace.memberCount > 1 && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
                                            <span>{workspace.memberCount} members</span>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}

                    {/* New Workspace Ghost Card */}
                    <CreateWorkspaceDialog>
                        <div className="h-full min-h-[220px] rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-accent/50 hover:text-accent-foreground transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center gap-4 text-center p-6 outline-none">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                                <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Create Workspace</h3>
                                <p className="text-sm text-muted-foreground">Start a new project</p>
                            </div>
                        </div>
                    </CreateWorkspaceDialog>
                </div>
            </main>
        </div>
    )
}
