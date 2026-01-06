"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CreateWorkspaceDialog } from "./create-workspace-dialog"
import type { WorkspaceWithRole } from "@/types/workspace"
import { Role } from "@prisma/client"

interface WorkspaceSwitcherProps {
    workspaces: (WorkspaceWithRole & { role: Role })[]
}

export function WorkspaceSwitcher({ workspaces }: WorkspaceSwitcherProps) {
    const [open, setOpen] = React.useState(false)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const router = useRouter()
    const params = useParams()
    const activeSlug = params?.workspaceSlug as string

    // Simple caching/optimistic update simulation could happen here, 
    // but for now relying on props passed from server component for freshness.

    const activeWorkspace = workspaces.find(w => w.slug === activeSlug) || workspaces[0]

    const onSelect = (workspace: typeof workspaces[0]) => {
        setOpen(false)
        router.push(`/workspace/${workspace.slug}/dashboard`)
    }

    return (
        <CreateWorkspaceDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-12 px-3 border-zinc-200 dark:border-zinc-800"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[10px] font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
                                {activeWorkspace?.icon || activeWorkspace?.name?.charAt(0) || "?"}
                            </span>
                            <span className="truncate text-sm font-medium">
                                {activeWorkspace?.name || "Select Workspace"}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search workspace..." />
                        <CommandList>
                            <CommandEmpty>No workspace found.</CommandEmpty>
                            <CommandGroup heading="My Workspaces">
                                {workspaces.map((workspace) => (
                                    <CommandItem
                                        key={workspace.id}
                                        onSelect={() => onSelect(workspace)}
                                        className="text-sm"
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-100 text-[10px] font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
                                                {workspace.icon || workspace.name.charAt(0)}
                                            </span>
                                            <span className="truncate flex-1">{workspace.name}</span>
                                            {activeSlug === workspace.slug && (
                                                <Check className="ml-auto h-4 w-4" />
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandList>
                            <CommandGroup>
                                <CommandItem
                                    onSelect={() => {
                                        setOpen(false)
                                        setDialogOpen(true)
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Workspace
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </CreateWorkspaceDialog>
    )
}
