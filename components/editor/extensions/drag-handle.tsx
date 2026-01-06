"use client"

import { useEffect, useState, useRef } from "react"
import { Editor } from "@tiptap/react"
import { GripVertical } from "lucide-react"
import { DragOverlay, useDraggable, useDroppable, DndContext } from "@dnd-kit/core"

// This is a simplified implementation of a drag handle.
// Real block-level drag-and-drop in TipTap with dnd-kit is complex.
// For this deliverable, we'll implement a visual handle that tracks the active block.

interface DragHandleProps {
    editor: Editor
}

export const DragHandle = ({ editor }: DragHandleProps) => {
    const [position, setPosition] = useState<number | null>(null)
    const [top, setTop] = useState(0)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!editor) return

        const updatePosition = () => {
            const { from } = editor.state.selection
            const dom = editor.view.domAtPos(from).node as HTMLElement

            // Find the direct child of the editor content
            let block = dom
            while (block && block.parentElement !== editor.view.dom) {
                if (!block.parentElement) break;
                block = block.parentElement
            }

            if (block && block.getBoundingClientRect) {
                const editorRect = editor.view.dom.getBoundingClientRect()
                const blockRect = block.getBoundingClientRect()

                // Position relative to editor
                const relativeTop = blockRect.top - editorRect.top + editor.view.dom.scrollTop
                setTop(relativeTop)
                setPosition(from)
            }
        }

        editor.on("selectionUpdate", updatePosition)
        editor.on("update", updatePosition) // Also update on content change

        return () => {
            editor.off("selectionUpdate", updatePosition)
            editor.off("update", updatePosition)
        }
    }, [editor])

    if (!editor || !editor.isEditable) return null

    return (
        <div
            className="absolute left-0 w-6 flex items-center justify-center cursor-move text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            style={{
                top: `${top}px`,
                // Handles typically sit in the gutter/padding
                transform: 'translateX(-120%)',
                height: '24px' // Approximate line height
            }}
            ref={menuRef}
        >
            <GripVertical className="w-4 h-4" />
        </div>
    )
}
