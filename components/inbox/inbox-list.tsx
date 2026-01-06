
"use client"

import * as React from "react"
import { InboxItem, InboxReason } from "@/lib/db/queries/inbox"
import { InboxRow } from "./inbox-row"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

interface InboxListProps {
    items: InboxItem[]
    workspaceSlug: string
}

export function InboxList({ items, workspaceSlug }: InboxListProps) {

    // Grouping logic
    const sections = React.useMemo(() => {
        const groups: Record<string, InboxItem[]> = {
            "Overdue": [],
            "Today": [],
            "Upcoming": [],
            "Needs Review": [],
            "Triage": []
        }

        items.forEach(item => {
            const reason = item.inboxReason

            if (reason === 'overdue') {
                groups["Overdue"]!.push(item)
            } else if (reason === 'due_soon') {
                groups["Upcoming"]!.push(item)
            } else if (reason === 'in_review') {
                groups["Needs Review"]!.push(item)
            } else if (reason === 'unprocessed') {
                groups["Triage"]!.push(item)
            } else {
                groups["Today"]!.push(item) // "Assigned to you" defaults here
            }
        })

        return groups
    }, [items])

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 space-y-4">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-foreground">All caught up!</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        Your inbox is empty. Tasks assigned to you or requiring attention will appear here.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {Object.entries(sections).map(([title, groupItems]) => {
                if (groupItems.length === 0) return null

                return (
                    <section key={title} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                                {title}
                                <span className="ml-2 py-0.5 px-1.5 rounded-full bg-muted text-[10px] text-foreground font-medium">
                                    {groupItems.length}
                                </span>
                            </h3>
                        </div>

                        <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                                {groupItems.map(item => (
                                    <InboxRow
                                        key={item.id}
                                        item={item}
                                        workspaceSlug={workspaceSlug}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                )
            })}
        </div>
    )
}
