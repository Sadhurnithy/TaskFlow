import { notFound } from "next/navigation"
import { getWorkspaceBySlug, getWorkspaceMembers } from "@/lib/db/queries/workspaces"
import { requireAuth } from "@/lib/auth/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { GeneralSettings } from "./_components/general-settings"
import { MembersList } from "./_components/members-list"
import { DangerZone } from "./_components/danger-zone"

interface SettingsPageProps {
    params: Promise<{
        workspaceSlug: string
    }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
    const session = await requireAuth()
    const { workspaceSlug } = await params
    const userId = session?.user?.id!

    const workspace = await getWorkspaceBySlug(workspaceSlug, userId)
    if (!workspace) notFound()

    // Verify ADMIN/OWNER access
    // Ideally this check should be robust. `getWorkspaceBySlug` returns `currentUserRole`.
    if (workspace.currentUserRole !== "OWNER" && workspace.currentUserRole !== "ADMIN") {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p>You need to be an Admin or Owner to view settings.</p>
            </div>
        )
    }

    const members = await getWorkspaceMembers(workspace.id)

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>
            <Separator />
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                    <GeneralSettings workspace={workspace} />
                </TabsContent>
                <TabsContent value="members" className="space-y-4">
                    <MembersList workspaceId={workspace.id} members={members} currentUserRole={workspace.currentUserRole} currentUserId={userId} />
                </TabsContent>
                <TabsContent value="danger" className="space-y-4">
                    <DangerZone workspace={workspace} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
