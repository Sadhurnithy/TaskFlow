"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InboxList } from "@/components/inbox/inbox-list"
import { NotificationRow } from "@/components/inbox/notification-row"
import { InboxItem } from "@/lib/db/queries/inbox"
import { Bell, Inbox as InboxIcon, Clock } from "lucide-react"

interface InboxTabsProps {
    inboxItems: InboxItem[]
    snoozedItems: InboxItem[]
    notifications: any[]
    workspaceSlug: string
}

export function InboxTabs({
    inboxItems,
    snoozedItems,
    notifications,
    workspaceSlug
}: InboxTabsProps) {
    return (
        <Tabs defaultValue="inbox" className="w-full flex-1 flex flex-col min-h-0">
            <div className="px-6 border-b bg-background z-10 sticky top-0 md:static">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 p-0">
                    <TabsTrigger
                        value="inbox"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <InboxIcon className="h-4 w-4" />
                            <span>Inbox</span>
                            {inboxItems.length > 0 && (
                                <span className="ml-1 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {inboxItems.length}
                                </span>
                            )}
                        </div>
                    </TabsTrigger>

                    <TabsTrigger
                        value="snoozed"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Snoozed</span>
                            {snoozedItems.length > 0 && (
                                <span className="ml-1 bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {snoozedItems.length}
                                </span>
                            )}
                        </div>
                    </TabsTrigger>

                    <TabsTrigger
                        value="updates"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span>Updates</span>
                            {notifications.length > 0 && (
                                <span className="ml-1 bg-blue-500/10 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {notifications.length}
                                </span>
                            )}
                        </div>
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="inbox" className="flex-1 overflow-auto p-4 md:p-6 mt-0">
                <div className="max-w-2xl mx-auto">
                    <InboxList items={inboxItems} workspaceSlug={workspaceSlug} />
                </div>
            </TabsContent>

            <TabsContent value="snoozed" className="flex-1 overflow-auto p-4 md:p-6 mt-0">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground px-1">Upcoming & Snoozed</h3>
                    </div>
                    <InboxList items={snoozedItems} workspaceSlug={workspaceSlug} />
                </div>
            </TabsContent>

            <TabsContent value="updates" className="flex-1 overflow-auto p-4 md:p-6 mt-0">
                <div className="max-w-2xl mx-auto space-y-2">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="h-12 w-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-sm font-medium text-foreground">No new updates</h3>
                            <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map((notification: any) => (
                            <NotificationRow key={notification.id} notification={notification} />
                        ))
                    )}
                </div>
            </TabsContent>
        </Tabs>
    )
}
