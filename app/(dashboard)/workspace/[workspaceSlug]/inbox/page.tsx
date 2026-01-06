
import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { getInboxItems, getInboxNotifications, getSnoozedItems } from "@/lib/db/queries/inbox"
import { InboxTabs } from "@/components/inbox/inbox-tabs"
import { getUserWorkspaces } from "@/lib/db/queries/workspaces"

interface InboxPageProps {
    params: Promise<{ workspaceSlug: string }>
}

export default async function InboxPage({ params }: InboxPageProps) {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/api/auth/signin")
    }

    const { workspaceSlug } = await params
    const workspace = (await getUserWorkspaces(session.user.id)).find(w => w.slug === workspaceSlug)
    if (!workspace) redirect("/")

    const [inboxItems, snoozedItems, notifications] = await Promise.all([
        getInboxItems(workspace.id, session.user.id),
        getSnoozedItems(workspace.id, session.user.id),
        getInboxNotifications(workspace.id, session.user.id)
    ])

    return (
        <div className="flex flex-col h-full w-full bg-background/50">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-background sticky top-0 z-20">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Inbox</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">Triage tasks and check updates.</p>
                </div>
            </div>

            <InboxTabs
                inboxItems={inboxItems}
                snoozedItems={snoozedItems}
                notifications={notifications}
                workspaceSlug={workspace.slug}
            />
        </div>
    )
}
