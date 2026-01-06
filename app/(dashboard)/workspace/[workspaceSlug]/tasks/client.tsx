"use client"

import * as React from "react"
import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation"
import {
    Kanban,
    List,
    ListFilter,
    MoreVertical,
    Search,
    SlidersHorizontal,
    Plus
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskRow } from "@/components/tasks/task-row"
import { TaskBoard } from "@/components/tasks/task-board"
import { CreateTaskForm } from "@/components/tasks/create-task-form"
import { EmptyState } from "@/components/shared/empty-state"
import { TaskTree } from "@/components/tasks/task-tree"
import type { TaskWithRelations } from "@/types/task"

interface TaskListViewProps {
    initialTasks: TaskWithRelations[]
    workspaceId: string
    currentUserRole?: string | null
}

import { TaskFilters } from "@/components/tasks/task-filters"
import type { TaskFilters as FilterType } from "@/types/task"

// ...

export function TaskListView({ initialTasks, workspaceId, currentUserRole }: TaskListViewProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const params = useParams()
    const workspaceSlug = params?.workspaceSlug as string

    const [searchQuery, setSearchQuery] = React.useState("")
    const [view, setView] = React.useState<"list" | "board">("list")
    const [filters, setFilters] = React.useState<FilterType>({})

    // Client-side filtering
    const filteredTasks = React.useMemo(() => {
        let result = initialTasks

        // 1. Search
        if (searchQuery) {
            const lower = searchQuery.toLowerCase()
            result = result.filter(t =>
                t.title.toLowerCase().includes(lower) ||
                t.description?.toLowerCase().includes(lower)
            )
        }

        // 2. Status Filter
        if (filters.status?.length) {
            result = result.filter(t => filters.status!.includes(t.status))
        }

        // 3. Priority Filter
        if (filters.priority?.length) {
            result = result.filter(t => filters.priority!.includes(t.priority))
        }

        // 4. Assignee (Future)

        return result
    }, [initialTasks, searchQuery, filters])

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b bg-background sticky top-0 z-10 gap-4">
                <div className="flex items-center gap-3 flex-1 w-full md:max-w-2xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 h-9 bg-muted/40 border-transparent hover:border-border transition-colors focus:bg-background focus:border-primary/20 w-full shadow-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Separator orientation="vertical" className="h-6 hidden md:block" />

                    <TaskFilters
                        filters={filters}
                        onFilterChange={setFilters}
                    />

                    <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as any)} className="border rounded-md p-0.5 h-8 bg-muted/20 gap-0">
                        <ToggleGroupItem value="list" size="sm" className="h-7 w-8 p-0 rounded-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">
                            <List className="h-3.5 w-3.5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="board" size="sm" className="h-7 w-8 p-0 rounded-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">
                            <Kanban className="h-3.5 w-3.5" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
                    {["OWNER", "ADMIN", "MEMBER"].includes(currentUserRole || "") && (
                        <CreateTaskForm workspaceId={workspaceId} />
                    )}
                </div>
            </div>

            {/* List View */}
            {view === "list" && (
                <div className="flex-1 overflow-auto p-4 space-y-1 pb-20 md:pb-4">
                    {filteredTasks.length === 0 ? (
                        <EmptyState
                            icon={Kanban}
                            title="No tasks found"
                            description={searchQuery ? "Try adjusting your filters." : "Create a task to get started."}
                            actionLabel={!searchQuery ? "Create Task" : undefined}
                        // onAction handled by dedicated button
                        />
                    ) : (
                        <TaskTree
                            tasks={filteredTasks}
                            workspaceId={workspaceId}
                            workspaceSlug={workspaceSlug}
                            currentUserRole={currentUserRole}
                        />
                    )}
                </div>
            )}

            {/* Board View */}
            {view === "board" && (
                <div className="flex-1 overflow-hidden p-4 pb-20 md:pb-4">
                    <TaskBoard tasks={filteredTasks} workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
                </div>
            )}

            {/* Mobile FAB */}
            {["OWNER", "ADMIN", "MEMBER"].includes(currentUserRole || "") && (
                <div className="md:hidden fixed bottom-6 right-6 z-50">
                    <CreateTaskForm workspaceId={workspaceId}>
                        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Plus className="h-6 w-6" />
                        </Button>
                    </CreateTaskForm>
                </div>
            )}
        </div>
    )
}
