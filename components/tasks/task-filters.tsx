"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Filter, X } from "lucide-react"
import { Priority, TaskStatus } from "@prisma/client"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { TaskFilters as FilterType } from "@/types/task"

interface TaskFiltersProps {
    filters: FilterType
    onFilterChange: (filters: FilterType) => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function TaskFilters({ filters, onFilterChange, open, onOpenChange }: TaskFiltersProps) {
    // Helper to toggle array item
    const toggleArray = (arr: string[] | undefined, item: string) => {
        const current = arr || []
        if (current.includes(item)) {
            return current.filter((i) => i !== item)
        }
        return [...current, item]
    }

    const activeCount =
        (filters.status?.length || 0) +
        (filters.priority?.length || 0) +
        (filters.assigneeId ? 1 : 0)

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground relative">
                    <Filter className="h-4 w-4" />
                    {activeCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-medium ring-2 ring-background">
                            {activeCount}
                        </span>
                    )}
                    <span className="sr-only">Filters</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                    <SheetTitle>Filter Tasks</SheetTitle>
                    <SheetDescription>
                        Narrow down your view
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 py-6 h-full">
                    {/* Status */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium leading-none">Status</h4>
                        <div className="grid gap-2">
                            {Object.values(TaskStatus).map((status) => (
                                <div key={status} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`status-${status}`}
                                        checked={filters.status?.includes(status)}
                                        onCheckedChange={() => {
                                            const newStatus = toggleArray(filters.status, status)
                                            onFilterChange({ ...filters, status: newStatus.length ? newStatus : undefined })
                                        }}
                                    />
                                    <Label htmlFor={`status-${status}`} className="text-sm font-normal capitalize">
                                        {status.replace(/_/g, " ").toLowerCase()}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Priority */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium leading-none">Priority</h4>
                        <div className="grid gap-2">
                            {Object.values(Priority).map((priority) => (
                                <div key={priority} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`priority-${priority}`}
                                        checked={filters.priority?.includes(priority)}
                                        onCheckedChange={() => {
                                            const newPriority = toggleArray(filters.priority, priority)
                                            onFilterChange({ ...filters, priority: newPriority.length ? newPriority : undefined })
                                        }}
                                    />
                                    <Label htmlFor={`priority-${priority}`} className="text-sm font-normal capitalize">
                                        {priority.toLowerCase()}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 mt-auto">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => onFilterChange({})}
                            disabled={activeCount === 0}
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
