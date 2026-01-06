import { getActiveSessions } from "@/actions/security-actions"

export const dynamic = "force-dynamic"

import { SettingsCard } from "@/components/settings/settings-card"
import { Button } from "@/components/ui/button"
import { Shield, Key } from "lucide-react"
import { PasswordUpdateDialog } from "@/components/settings/security/password-dialog"
import { SessionList } from "@/components/settings/security/session-list"

export default async function SecurityPage() {
    const sessions = await getActiveSessions()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-medium tracking-tight">Security</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account security and sessions.
                </p>
            </div>

            <SettingsCard title="Authentication" description="How you log in to your account.">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-medium">Password</p>
                            <p className="text-sm text-muted-foreground">Secure your account with a strong password.</p>
                        </div>
                    </div>
                    <PasswordUpdateDialog>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">Change Password</Button>
                    </PasswordUpdateDialog>
                </div>
            </SettingsCard>

            <SettingsCard title="Active Sessions" description="Manage devices where you are currently logged in.">
                <SessionList sessions={sessions} />
            </SettingsCard>
        </div>
    )
}
