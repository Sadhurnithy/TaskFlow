import { requireAuth } from "@/lib/auth/utils"

export const dynamic = "force-dynamic"

import { ProfileHeader } from "@/components/settings/profile-header"
import { SettingsCard } from "@/components/settings/settings-card"
import { InfoCard } from "@/components/settings/info-card"
import { BasicInfo } from "@/components/settings/profile/basic-info"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default async function ProfilePage() {
    const session = await requireAuth()
    const user = session.user

    if (!user) return null

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-medium tracking-tight">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your personal information and account security.
                </p>
            </div>

            <Separator />

            <ProfileHeader user={user} />

            <div className="grid gap-6">
                <BasicInfo user={user} />

                <SettingsCard
                    title="Account Identity"
                    description="Details about your account and authentication.">

                    <InfoCard
                        label="User ID"
                        value={user.id || "Unknown"}
                        className="font-mono text-xs"
                        action={<Button variant="ghost" size="sm" className="h-8">Copy</Button>}
                    />
                    <Separator />
                    <InfoCard
                        label="Authentication Method"
                        value={user.image?.includes("google") ? "Google OAuth" : "Email & Password"}
                    />
                </SettingsCard>
            </div>
        </div>
    )
}
