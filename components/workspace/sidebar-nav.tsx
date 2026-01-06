"use strict";
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Inbox,
    CheckSquare,
    FileText,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
    slug: string;
    inboxCount: number;
}

export function SidebarNav({ slug, inboxCount }: SidebarNavProps) {
    const pathname = usePathname();

    const items = [
        {
            title: "Dashboard",
            href: `/workspace/${slug}/dashboard`,
            icon: LayoutDashboard,
            matchExact: true,
        },
        {
            title: "Inbox",
            href: `/workspace/${slug}/inbox`,
            icon: Inbox,
            badge: inboxCount > 0 ? inboxCount : undefined
        },
        {
            title: "Tasks",
            href: `/workspace/${slug}/tasks`,
            icon: CheckSquare,
        },
        {
            title: "Notes",
            href: `/workspace/${slug}/notes`,
            icon: FileText,
        },
        {
            title: "Settings",
            href: `/workspace/${slug}/settings`,
            icon: Settings,
        }
    ];

    return (
        <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
            {items.map((item, index) => {
                const isActive = item.matchExact
                    ? pathname === item.href
                    : pathname?.startsWith(item.href);

                return (
                    <Link
                        key={index}
                        href={item.href}
                        className={cn(
                            "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all hover:text-foreground",
                            isActive
                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <item.icon className={cn(
                            "mr-2 h-4 w-4",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        <span>{item.title}</span>
                        {item.badge && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
