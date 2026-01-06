"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { AlignLeft } from "lucide-react"
import { toast } from "sonner"

interface TaskDescriptionProps {
    description: string
    setDescription: (description: string) => void
    canEdit: boolean
    onUpdate: (data: Partial<any>) => void
}

export function TaskDescription({ description, setDescription, canEdit, onUpdate }: TaskDescriptionProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const [localDescription, setLocalDescription] = React.useState(description)

    React.useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus()
            // set cursor to end
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
        }
    }, [isEditing])

    React.useEffect(() => {
        setLocalDescription(description)
    }, [description])

    const handleSave = () => {
        setIsEditing(false)
        if (localDescription !== description) {
            setDescription(localDescription)
            onUpdate({ description: localDescription })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsEditing(false)
            setLocalDescription(description) // Revert
        }
        // Optional: formatting shortcuts?
    }

    if (!localDescription && !canEdit) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40 border-2 border-dashed rounded-xl bg-muted/5">
                <AlignLeft className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-sm">No description provided</span>
            </div>
        )
    }

    if (!localDescription && canEdit) {
        return (
            <div
                className="group relative cursor-text"
                onClick={(e) => {
                    const textarea = e.currentTarget.querySelector('textarea')
                    textarea?.focus()
                }}
            >
                <div className="absolute inset-0 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5 transition-colors group-hover:bg-muted/10 group-hover:border-muted-foreground/30 pointer-events-none" />
                <div className="relative p-6 flex flex-col items-center justify-center text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/80 pointer-events-none">
                    <AlignLeft className="h-6 w-6 mb-2 opacity-70" />
                    <span className="text-sm font-medium">Add a description...</span>
                </div>
                <Textarea
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={handleSave}
                    className="absolute inset-0 h-full w-full resize-none bg-transparent border-0 focus-visible:ring-0 p-6 text-sm opacity-0 focus:opacity-100 z-10 transition-opacity"
                    placeholder="Describe this task..."
                />
            </div>
        )
    }

    return (
        <div className="relative group/desc">
            {isEditing ? (
                <Textarea
                    ref={textareaRef}
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="min-h-[120px] resize-none border-0 focus-visible:ring-0 p-0 text-sm leading-relaxed bg-transparent"
                    placeholder="Add a description..."
                />
            ) : (
                <div
                    onClick={() => {
                        if (canEdit) {
                            setIsEditing(true)
                        } else {
                            toast.error("You do not have permission to edit description")
                        }
                    }}
                    className={cn(
                        "min-h-[120px] text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/90 py-1",
                        canEdit ? "cursor-text" : "cursor-not-allowed text-foreground/80"
                    )}
                >
                    {description}
                </div>
            )}
        </div>
    )
}
