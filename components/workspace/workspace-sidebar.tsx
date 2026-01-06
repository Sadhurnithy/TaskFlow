import Link from "next/link"
import {
    LayoutDashboard,
    Inbox,
    CheckSquare,
    FileText,
    Settings,
    Keyboard,
    Menu,
    ArrowLeft
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { UserMenu } from "@/components/shared/user-menu"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { getUserWorkspaces } from "@/lib/db/queries/workspaces"
import { getInboxCount } from "@/lib/db/queries/inbox"
import { SidebarNav } from "./sidebar-nav"

interface WorkspaceSidebarProps {
    user: {
        id: string
        name?: string | null
        email?: string | null
        image?: string | null
    }
    activeSlug?: string
}

export async function WorkspaceSidebar({ user, activeSlug }: WorkspaceSidebarProps) {
    const workspaces = await getUserWorkspaces(user.id)

    // Find active workspace ID if we have a slug
    const activeWorkspace = activeSlug ? workspaces.find(w => w.slug === activeSlug) : null
    const inboxCount = activeWorkspace ? await getInboxCount(activeWorkspace.id, user.id) : 0

    const SidebarContent = () => (
        <div className="flex h-full flex-col gap-2 bg-muted/10">
            {/* Header / Switcher */}
            <div className="flex flex-col gap-2 p-4 pb-2">
                <Link href="/dashboard" className="mb-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground -ml-2 gap-1">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Back to Workspaces</span>
                    </Button>
                </Link>
                <WorkspaceSwitcher workspaces={workspaces} />
            </div>

            <Separator className="mx-4 w-auto opacity-50" />

            {/* Main Nav */}
            <ScrollArea className="flex-1 py-4">
                <SidebarNav slug={activeSlug || ""} inboxCount={inboxCount} />
            </ScrollArea>

            <Separator className="mx-4 w-auto opacity-50" />
            {/* Footer / User */}
            <div className="p-4 mt-auto space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground">
                    <Keyboard className="mr-2 h-4 w-4" />
                    Shortcuts
                </Button>
                <div className="pt-2 flex items-center gap-3">
                    <UserMenu user={user} />
                    {activeWorkspace && (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium leading-none truncate max-w-[140px]">{user.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                                {activeWorkspace.role}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-[260px] flex-col border-r bg-background h-screen sticky top-0 z-30">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <div className="md:hidden fixed top-4 left-4 z-40">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-md border border-border/50">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[280px]">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}
