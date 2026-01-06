import { requireAuth } from "@/lib/auth/utils"
import { getUserWorkspaces } from "@/lib/db/queries/workspaces"
import { UserMenu } from "@/components/shared/user-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Layout, Clock, ArrowUpRight, CheckCircle2 } from "lucide-react"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
    const session = await requireAuth()
    const workspaces = await getUserWorkspaces(session.user!.id as string)
    const user = session.user
    const firstName = user!.name?.split(' ')[0] || 'User'

    return (
        // Gradient Mesh Background
        <div className="min-h-screen bg-[#FBFBFD] dark:bg-black selection:bg-blue-500/30">
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light"></div>

            {/* Ambient Light Effect */}
            <div className="fixed top-[-20%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Navbar - Floating Glass */}
            <header className="sticky top-4 z-50 px-4 md:px-8 max-w-5xl mx-auto">
                <div className="flex h-16 items-center justify-between rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-sm px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                            <Layout className="h-4 w-4" />
                        </div>
                        <span className="font-semibold tracking-tight text-lg">
                            TaskNotes
                        </span>
                    </div>
                    <UserMenu user={user!} />
                </div>
            </header>

            <main className="relative container max-w-5xl mx-auto pt-24 pb-12 px-4 md:px-8">
                {/* Hero Section */}
                <div className="mb-16 text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-normal bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 backdrop-blur-sm">
                        👋 Welcome back, {firstName}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                        Your Workspaces
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Manage your projects, track your progress, and collaborate with your team in a unified interface.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace, i) => (
                        <Link
                            key={workspace.id}
                            href={`/workspace/${workspace.slug}/dashboard`}
                            className="group relative outline-none animate-in fade-in slide-in-from-bottom-8 duration-700"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative h-full flex flex-col justify-between p-6 rounded-3xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-black/5 dark:border-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                                            {workspace.icon || "⚡"}
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-xl mb-2 text-zinc-900 dark:text-zinc-50">
                                        {workspace.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                        {workspace.description || "No description provided."}
                                    </p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                            {workspace.lastAccessedAt ? new Date(workspace.lastAccessedAt).toLocaleDateString() : 'New'}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="border-black/10 dark:border-white/10 capitalize">
                                        {workspace.role.toLowerCase()}
                                    </Badge>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Create New Card */}
                    <CreateWorkspaceDialog>
                        <button className="group relative h-full min-h-[280px] w-full flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 border-dashed border-black/5 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${workspaces.length * 100}ms` }}>
                            <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
                                <Plus className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-lg text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Create Workspace</span>
                                <span className="text-sm text-muted-foreground">Start a new journey</span>
                            </div>
                        </button>
                    </CreateWorkspaceDialog>
                </div>

                {/* Empty State Help */}
                {workspaces.length === 0 && (
                    <div className="mt-12 text-center animate-in fade-in zoom-in duration-700 delay-300">
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Pro tip: You can link multiple accounts in Settings</span>
                        </p>
                    </div>
                )}
            </main>
        </div>
    )
}
