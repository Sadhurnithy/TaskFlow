"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"

import { AvatarUpdateDialog } from "@/components/settings/profile/avatar-update-dialog"

interface ProfileHeaderProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    const initials = user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6">
            <AvatarUpdateDialog currentImage={user.image}>
                <div className="relative group cursor-pointer">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback className="text-2xl bg-muted">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                    </div>
                </div>
            </AvatarUpdateDialog>

            <div className="space-y-1 text-center sm:text-left pt-2">
                <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="pt-2">
                    <AvatarUpdateDialog currentImage={user.image}>
                        <Button size="sm" variant="outline" className="h-8">Change Avatar</Button>
                    </AvatarUpdateDialog>
                </div>
            </div>
        </div>
    )
}
