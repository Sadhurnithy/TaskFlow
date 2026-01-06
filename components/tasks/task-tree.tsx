"use client"

import * as React from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { TaskRow } from "./task-row"
import { Button } from "@/components/ui/button"
import type { TaskWithRelations } from "@/types/task"

interface TaskTreeProps {
    tasks: TaskWithRelations[]
    workspaceId: string
    workspaceSlug: string
    currentUserRole?: string | null
}

export function TaskTree({ tasks, workspaceId, workspaceSlug, currentUserRole }: TaskTreeProps) {
    // 1. Group tasks by parentId efficiently
    const tasksByParent = React.useMemo(() => {
        const groups: Record<string, TaskWithRelations[]> = {}
        const roots: TaskWithRelations[] = []

        tasks.forEach(task => {
            if (task.parentId) {
                const pid = task.parentId
                if (!groups[pid]) groups[pid] = []
                groups[pid].push(task)
            } else {
                roots.push(task)
            }
        })
        return { groups, roots }
    }, [tasks])

    return (
        <div className="space-y-1">
            {tasksByParent.roots.map(task => (
                <TaskTreeItem
                    key={task.id}
                    task={task}
                    childrenTasksMap={tasksByParent.groups}
                    workspaceId={workspaceId}
                    workspaceSlug={workspaceSlug}
                    currentUserRole={currentUserRole}
                    level={0}
                />
            ))}
        </div>
    )
}

interface TaskTreeItemProps {
    task: TaskWithRelations
    childrenTasksMap: Record<string, TaskWithRelations[]>
    workspaceId: string
    workspaceSlug: string
    currentUserRole?: string | null
    level: number
}

function TaskTreeItem({ task, childrenTasksMap, workspaceId, workspaceSlug, currentUserRole, level }: TaskTreeItemProps) {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const children = childrenTasksMap[task.id] || []
    const hasChildren = children.length > 0

    return (
        <div className="relative">
            <div className="flex items-start gap-1">
                {/* Toggle Button / Indentation Spacer */}
                <div
                    className="shrink-0 flex items-center justify-center w-6 h-10 mt-1 md:mt-0"
                    style={{ marginLeft: `${level * 1.5}rem` }}
                >
                    {hasChildren && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 hover:bg-muted/50"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <TaskRow
                        task={task}
                        workspaceId={workspaceId}
                        workspaceSlug={workspaceSlug}
                        currentUserRole={currentUserRole}
                    />
                </div>
            </div>

            {/* Recursive Children */}
            {isExpanded && hasChildren && (
                <div>
                    {children.map(child => (
                        <TaskTreeItem
                            key={child.id}
                            task={child}
                            childrenTasksMap={childrenTasksMap}
                            workspaceId={workspaceId}
                            workspaceSlug={workspaceSlug}
                            currentUserRole={currentUserRole}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
