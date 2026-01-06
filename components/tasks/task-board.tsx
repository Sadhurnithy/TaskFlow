"use client"

import * as React from "react"
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    type DropAnimation,
    useDroppable,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { TaskStatus } from "@prisma/client"

import { TaskCard } from "./task-card"
import type { TaskWithRelations } from "@/types/task"
import { updateTask } from "@/actions/task-actions"
import { cn } from "@/lib/utils"

interface TaskBoardProps {
    tasks: TaskWithRelations[]
    workspaceId: string
    workspaceSlug: string
}

const COLUMNS: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE]

export function TaskBoard({ tasks: initialTasks, workspaceId, workspaceSlug }: TaskBoardProps) {
    const [tasks, setTasks] = React.useState<TaskWithRelations[]>(initialTasks)
    const [activeId, setActiveId] = React.useState<string | null>(null)

    React.useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    // Explicit sensors for best cross-device support
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Slight distance to distinguish clicks from drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        const activeTask = tasks.find(t => t.id === activeId)
        const overTask = tasks.find(t => t.id === overId)

        if (!activeTask) return

        // Scenario 1: Dragging over another task
        if (overTask) {
            if (activeTask.status !== overTask.status) {
                setTasks((items) => {
                    const activeIndex = items.findIndex((t) => t.id === activeId)
                    const overIndex = items.findIndex((t) => t.id === overId)

                    const activeItem = items[activeIndex]
                    const overItem = items[overIndex]

                    if (!activeItem || !overItem) {
                        return items
                    }

                    const newItems = [...items]

                    // Optimistic status update
                    if (activeItem.status !== overItem.status) {
                        newItems[activeIndex] = {
                            ...activeItem,
                            status: overItem.status
                        }
                    }

                    return arrayMove(newItems, activeIndex, overIndex)
                })
            } else {
                // Sorting in same column
                setTasks((items) => {
                    const activeIndex = items.findIndex((t) => t.id === activeId)
                    const overIndex = items.findIndex((t) => t.id === overId)
                    return arrayMove(items, activeIndex, overIndex)
                })
            }
        }
        // Scenario 2: Dragging over a column (empty area)
        else {
            const isOverColumn = COLUMNS.includes(overId as TaskStatus)
            if (isOverColumn) {
                const newStatus = overId as TaskStatus
                if (activeTask.status !== newStatus) {
                    setTasks((items) => {
                        const activeIndex = items.findIndex(t => t.id === activeId)
                        if (activeIndex === -1) return items

                        const newItems = [...items]
                        if (newItems[activeIndex]) {
                            newItems[activeIndex] = { ...newItems[activeIndex], status: newStatus }
                        }
                        return newItems
                    })
                }
            }
        }
    }

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeId = active.id as string

        // Find task in CURRENT state (it might have moved in onDragOver)
        const activeTask = tasks.find(t => t.id === activeId)
        if (!activeTask) return

        const newStatus = activeTask.status; // This is the final status after onDragOver

        const originalTask = initialTasks.find(t => t.id === activeId)

        // Only update server if status actually changed from what server knows
        if (originalTask && (originalTask.status !== newStatus)) {
            await updateTask(activeId, { status: newStatus, workspaceId })
        }
    }

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex h-full flex-col md:flex-row gap-4 overflow-y-auto md:overflow-y-hidden md:overflow-x-hidden pb-4 snap-y px-4 md:px-0 scroll-smooth">
                {COLUMNS.map((status) => (
                    <BoardColumn
                        key={status}
                        status={status}
                        tasks={tasks.filter(t => t.status === status)}
                        workspaceId={workspaceId}
                        workspaceSlug={workspaceSlug}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={dropAnimationConfig}>
                {activeTask ? (
                    <TaskCard task={activeTask} view="board" workspaceId={workspaceId} workspaceSlug={workspaceSlug} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

function BoardColumn({ status, tasks, workspaceId, workspaceSlug }: { status: TaskStatus, tasks: TaskWithRelations[], workspaceId: string, workspaceSlug: string }) {
    const { setNodeRef } = useDroppable({
        id: status,
        data: { type: "Column", status },
    })

    const headerColors: Record<TaskStatus, string> = {
        [TaskStatus.TODO]: "text-slate-700 dark:text-slate-300",
        [TaskStatus.IN_PROGRESS]: "text-blue-700 dark:text-blue-300",
        [TaskStatus.IN_REVIEW]: "text-purple-700 dark:text-purple-300",
        [TaskStatus.DONE]: "text-green-700 dark:text-green-300",
        [TaskStatus.CANCELLED]: "text-red-700 dark:text-red-300",
    }

    return (
        <div ref={setNodeRef} className={cn(
            "flex h-auto md:h-full w-full md:flex-1 min-w-full md:min-w-0 flex-col rounded-xl border bg-muted/40 transition-colors duration-200 snap-center shrink-0"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className={cn(
                        "h-2.5 w-2.5 rounded-full ring-2 ring-background/50",
                        status === "TODO" ? "bg-slate-500" :
                            status === "IN_PROGRESS" ? "bg-blue-500" :
                                status === "IN_REVIEW" ? "bg-purple-500" :
                                    status === "DONE" ? "bg-green-500" :
                                        "bg-red-500"
                    )} />
                    <h3 className={cn("text-sm font-semibold capitalize tracking-tight", headerColors[status])}>
                        {status.toLowerCase().replace(/_/g, " ")}
                    </h3>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-background/50 text-[11px] font-medium text-muted-foreground px-1.5 ml-1">
                        {tasks.length}
                    </span>
                </div>

                {/* Optional: Add Overflow Menu here later if needed */}
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3 min-h-[100px] h-full">
                        {/* Empty State / Drop Zone */}
                        {tasks.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-muted/30 rounded-lg text-muted-foreground/40 text-sm opacity-50 hover:opacity-100 transition-opacity">
                                <span>No tasks</span>
                            </div>
                        )}
                        {tasks.map((task) => (
                            <TaskCard key={task.id} task={task} view="board" workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}

const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: "0.5",
            },
        },
    }),
}
