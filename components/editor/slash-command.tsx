"use client"

import { Editor, Range, Extension } from "@tiptap/core"
import { ReactRenderer } from "@tiptap/react"
import Suggestion, { SuggestionProps } from "@tiptap/suggestion"
import {
    Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
    Quote as QuoteIcon, Code, Image as ImageIcon, Minus,
    Table, Info, FileText, CheckCircle
} from "lucide-react"
import tippy, { Instance } from "tippy.js"
import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { cn } from "@/lib/utils"

// Command Interface
interface CommandItemProps {
    title: string
    description: string
    icon: React.ElementType
    command: (editor: Editor, range: Range) => void
}

// Command List
const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: "Heading 1",
            description: "Big section heading",
            icon: Heading1,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run()
            },
        },
        {
            title: "Heading 2",
            description: "Medium section heading",
            icon: Heading2,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run()
            },
        },
        {
            title: "Bullet List",
            description: "Simple bullet points",
            icon: List,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run()
            },
        },
        {
            title: "Numbered List",
            description: "Ordered list",
            icon: ListOrdered,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run()
            },
        },
        {
            title: "Task List",
            description: "Track tasks with a todo list",
            icon: CheckSquare,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run()
            },
        },
        {
            title: "Quote",
            description: "Capture a quote",
            icon: QuoteIcon,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setBlockquote().run()
            },
        },
        {
            title: "Image",
            description: "Upload an image",
            icon: ImageIcon,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).run()
                // Trigger file upload selector logically
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = async () => {
                    if (input.files?.length) {
                        const file = input.files[0]
                        // Import directly here or rely on global? 
                        // For now, let's use the same upload logic if possible or just simplified
                        // Since we can't easily import uploadToCloudinary here due to client boundaries sometimes
                        // We will rely on a custom event or a simpler direct flow if needed.
                        // Actually, slash-command is client side.
                        const { uploadToCloudinary } = await import("@/lib/utils/upload") // dynamic import
                        const url = await uploadToCloudinary(file)
                        if (url) {
                            editor.chain().focus().setImage({ src: url }).run()
                        }
                    }
                }
                input.click()
            },
        },
        {
            title: "Callout",
            description: "Highlight information",
            icon: Info,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).insertContent({ type: 'callout', attrs: { type: 'info' } }).run()
            },
        },
        {
            title: "Task Embed",
            description: "Embed a task card",
            icon: CheckCircle,
            command: ({ editor, range }: any) => {
                // In real app, open dialog first. For now, insert dummy.
                editor.chain().focus().deleteRange(range).insertContent({ type: 'taskEmbed', attrs: { taskId: 'dummy-123' } }).run()
            },
        },
        {
            title: "Code Block",
            description: "Code with syntax highlighting",
            icon: Code,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setCodeBlock().run()
            },
        },
        {
            title: "Divider",
            description: "Visually separate content",
            icon: Minus,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run()
            },
        },
    ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
}

// React Component for render
const CommandList = forwardRef(({ items, command }: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = useCallback(
        (index: number) => {
            const item = items[index]
            if (item) {
                command(item)
            }
        },
        [command, items]
    )

    useEffect(() => {
        setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex((selectedIndex + items.length - 1) % items.length)
                return true
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex((selectedIndex + 1) % items.length)
                return true
            }
            if (event.key === "Enter") {
                selectItem(selectedIndex)
                return true
            }
            return false
        },
    }))

    return (
        <div className="z-50 min-w-[300px] overflow-hidden rounded-md border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95 duration-150">
            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                {items.length === 0 ? (
                    <p className="p-2 text-xs text-muted-foreground">No commands found</p>
                ) : (
                    items.map((item: any, index: number) => (
                        <button
                            key={index}
                            className={cn(
                                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
                                index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                            )}
                            onClick={() => selectItem(index)}
                        >
                            <div className="flex items-center justify-center w-5 h-5 rounded border bg-background text-muted-foreground">
                                <item.icon className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="font-medium">{item.title}</span>
                                <span className="text-[10px] text-muted-foreground">{item.description}</span>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    )
})

CommandList.displayName = "CommandList"

// Tiptap Extension wrapper
const renderItems = () => {
    let component: ReactRenderer | null = null
    let popup: Instance | null = null

    return {
        onStart: (props: SuggestionProps) => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            })

            if (!props.clientRect) return

            // @ts-ignore
            popup = tippy(document.body, {
                getReferenceClientRect: props.clientRect as any, // Tippy types are strict
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
            })
        },
        onUpdate: (props: SuggestionProps) => {
            component?.updateProps(props)

            if (!props.clientRect) return

            popup?.setProps({
                getReferenceClientRect: props.clientRect as any,
            })
        },
        onKeyDown: (props: any) => { // Cast to any to access event
            if (props.event.key === "Escape") {
                popup?.hide()
                return true
            }
            return (component?.ref as any)?.onKeyDown(props)
        },
        onExit: () => {
            popup?.destroy()
            component?.destroy()
        },
    }
}

export const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range })
                },
            },
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ]
    },
}).configure({
    suggestion: {
        items: getSuggestionItems,
        render: renderItems,
    },
})
