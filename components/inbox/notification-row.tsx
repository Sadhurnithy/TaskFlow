"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { motion, useMotionValue } from "framer-motion"
import { Check, MessageSquare, AtSign, UserPlus, FileText, Bell, Inbox, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
// import type { Notification } from "@prisma/client" // Assuming type is available, or use specific query type
import { toast } from "sonner"
import { markNotificationRead } from "@/actions/notification-actions"

interface NotificationRowProps {
    notification: any // Replace with proper type from query result
}

const iconConfig: Record<string, any> = {
    "TASK_COMMENT": { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
    "NOTE_COMMENT": { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
    "MENTION": { icon: AtSign, color: "text-orange-500", bg: "bg-orange-500/10" },
    "TASK_ASSIGNED": { icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    "NOTE_SHARED": { icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
    "default": { icon: Bell, color: "text-gray-500", bg: "bg-gray-500/10" }
}

export function NotificationRow({ notification }: NotificationRowProps) {
    const [isPending, startTransition] = React.useTransition()
    const [optimisticRead, setOptimisticRead] = React.useOptimistic(notification.read)

    // Swipe Logic
    const x = useMotionValue(0)

    const handleDragEnd = async (_: any, info: any) => {
        if (info.offset.x > 100) {
            // Swiped Right -> Mark Read/Archive
            startTransition(async () => {
                setOptimisticRead(true) // Optimistically hide
                const res = await markNotificationRead(notification.id)
                if (res.success) {
                    toast.success("Notification archived")
                } else {
                    toast.error("Failed to archive")
                    setOptimisticRead(false)
                }
            })
        }
    }

    if (optimisticRead) return null

    const config = iconConfig[notification.type] || iconConfig.default
    const Icon = config.icon

    return (
        <div className="relative group touch-pan-y">
            {/* Background Layer */}
            <div className="absolute inset-0 rounded-lg flex items-center justify-start px-4 z-0 bg-blue-500/20 overflow-hidden">
                <motion.div
                    style={{ opacity: x.get() > 0 ? 1 : 0 }}
                    className="flex items-center gap-2 text-blue-600 font-medium"
                >
                    <Check className="h-5 w-5" />
                    <span className="text-xs uppercase tracking-wider">Mark Read</span>
                </motion.div>
            </div>

            <motion.div
                layout
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="relative z-10 flex items-start gap-3 p-4 bg-card border rounded-lg shadow-sm hover:shadow-md hover:border-border transition-all cursor-grab active:cursor-grabbing select-none"
            >
                {/* Icon Identifier */}
                <div className={cn("flex items-center justify-center h-8 w-8 rounded-full shrink-0 mt-0.5", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground leading-none">
                        {notification.title}
                    </p>
                    {notification.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                        </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                </div>

                {/* Unread Dot Indicator - if needed visually, though presence implies unread */}
                <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
            </motion.div>
        </div>
    )
}
