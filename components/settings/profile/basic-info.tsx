"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateUserProfile } from "@/actions/user-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SettingsCard } from "@/components/settings/settings-card"
import { InfoCard } from "@/components/settings/info-card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface BasicInfoProps {
    user: {
        name?: string | null
        email?: string | null
    }
}

export function BasicInfo({ user }: BasicInfoProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(user.name || "")
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSave = () => {
        if (name.length < 2) {
            toast.error("Name must be at least 2 characters")
            return
        }

        startTransition(async () => {
            try {
                const result = await updateUserProfile({ name })
                if (result.success) {
                    toast.success("Profile updated")
                    setIsEditing(false)
                    router.refresh()
                } else {
                    toast.error("Failed to update profile")
                }
            } catch (error) {
                toast.error("Something went wrong")
            }
        })
    }

    return (
        <SettingsCard
            title="Basic Information"
            description="Your public profile information."
        >
            {isEditing ? (
                <div className="flex items-center justify-between py-3">
                    <div className="space-y-2 w-full max-w-sm">
                        <label className="text-sm font-medium">Display Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isPending}>
                            {isPending ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            ) : (
                <InfoCard
                    label="Display Name"
                    value={user.name || "Not set"}
                    action={
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </Button>
                    }
                />
            )}

            <Separator />

            <InfoCard
                label="Email Address"
                value={user.email || "Not set"}
                action={<Badge variant="secondary" className="font-normal text-muted-foreground">Verified</Badge>}
            />
        </SettingsCard>
    )
}
