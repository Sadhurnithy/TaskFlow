"use client"

import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { Node } from "@tiptap/core"
import { CheckCircle, User as UserIcon, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export interface TaskEmbedAttributes {
    taskId: string
}

// Mock function to fetch task - replace with actual server action or query hook
const fetchTaskData = async (taskId: string) => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
        id: taskId,
        title: "Implement Authentication Flow",
        status: "IN_PROGRESS",
        assignee: { name: "Alice", image: null },
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
    }
}

const TaskEmbedComponent = ({ node, updateAttributes, deleteNode }: any) => {
    const [task, setTask] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const taskId = node.attrs.taskId
        if (taskId) {
            console.log("Fetching task", taskId)
            fetchTaskData(taskId).then(data => {
                setTask(data)
                setLoading(false)
            })
        }
    }, [node.attrs.taskId])

    return (
        <NodeViewWrapper className="my-4">
            <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group",
                loading && "opacity-70 animate-pulse"
            )}>
                {/* Checkbox */}
                <div
                    className="flex-shrink-0 text-muted-foreground hover:text-primary cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation()
                        // Toggle status logic
                    }}
                >
                    <CheckCircle className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                            {loading ? "Loading task..." : task?.title || "Task not found"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium uppercase tracking-wider">
                            {task?.status?.replace("_", " ") || "OPEN"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            <span>{task?.assignee?.name || "Unassigned"}</span>
                        </div>
                        {task?.dueDate && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{task.dueDate.toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <button
                    onClick={deleteNode}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                >
                    <span className="sr-only">Delete</span>
                    ×
                </button>
            </div>
        </NodeViewWrapper>
    )
}

export const TaskEmbed = Node.create({
    name: "taskEmbed",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            taskId: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: "task-embed",
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ["task-embed", HTMLAttributes]
    },

    addNodeView() {
        return ReactNodeViewRenderer(TaskEmbedComponent)
    },
})
