"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { revokeOtherSessions } from "@/actions/security-actions"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Smartphone, Globe } from "lucide-react"
import { format } from "date-fns"

interface Session {
    id: string
    expires: Date
    userAgent?: string
}

export function SessionList({ sessions = [] }: { sessions: any[] }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleLogoutAll = () => {
        startTransition(async () => {
            await revokeOtherSessions()
            toast.success("Logged out of other devices")
            router.refresh()
        })
    }

    return (
        <div>
            {sessions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">No active sessions found (using database adaptor).</div>
            ) : (
                sessions.map((session, i) => (
                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-2">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium truncate">Active Session {i + 1}</p>
                                <p className="text-sm text-muted-foreground truncate">Expires {format(new Date(session.expires), "PPP")}</p>
                            </div>
                        </div>
                        {i === 0 && <div className="text-sm text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded w-fit mt-2 sm:mt-0">Current</div>}
                    </div>
                ))
            )}

            <Separator className="my-4" />
            <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={handleLogoutAll}
                disabled={isPending || sessions.length <= 1}
            >
                {isPending ? "Logging out..." : "Log out of all other devices"}
            </Button>
        </div>
    )
}
