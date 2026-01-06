import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/utils"
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar"
import { checkUserWorkspaceAccess } from "@/lib/db/queries/workspaces"

interface WorkspaceLayoutProps {
    children: React.ReactNode
    params: Promise<{
        workspaceSlug: string
    }>
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
    const session = await requireAuth()
    const { workspaceSlug } = await params

    // We don't strictly *need* to check access here if every page checks it,
    // but it's good practice to verify access to the layout wrapper too.
    // Only issue is resolving slug to ID for checkUserWorkspaceAccess.
    // Our queries might need an update to check by slug, or we fetch workspace by slug first.

    // Let's postpone strict blocking here to the individual pages or assume Sidebar handles "not found" gracefully?
    // Actually, if we are in this layout, we want to show the sidebar.
    // The sidebar fetches "user workspaces".

    return (
        <div className="flex min-h-screen bg-background">
            <WorkspaceSidebar user={session.user as { id: string; name?: string | null; email?: string | null; image?: string | null }} activeSlug={workspaceSlug} />
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Mobile Header placeholder if needed, acts as spacer for fixed trigger */}
                <div className="md:hidden h-16" />
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
