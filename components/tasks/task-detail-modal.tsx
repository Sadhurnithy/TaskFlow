"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import type { TaskWithRelations } from "@/types/task"
import { TaskDetailView } from "./task-detail-view"

interface TaskDetailModalProps {
    task: TaskWithRelations
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: string
    workspaceSlug: string
}

export function TaskDetailModal({ task, open, onOpenChange, workspaceId, workspaceSlug }: TaskDetailModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row sm:rounded-xl border-border/50 shadow-2xl">
                <DialogTitle className="sr-only">Task Details</DialogTitle>
                <TaskDetailView
                    task={task}
                    workspaceId={workspaceId}
                    workspaceSlug={workspaceSlug}
                    isModal={true}
                    onDelete={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
