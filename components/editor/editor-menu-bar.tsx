"use client"

import { BubbleMenu, Editor } from "@tiptap/react"
import {
    Bold, Italic, Strikethrough, Code, Link as LinkIcon,
    Highlighter, AlignLeft, AlignCenter, AlignRight
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface EditorMenuBarProps {
    editor: Editor
}

export function EditorMenuBar({ editor }: EditorMenuBarProps) {
    const [isLinkOpen, setIsLinkOpen] = useState(false)
    const [linkUrl, setLinkUrl] = useState("")

    if (!editor) return null

    const items = [
        {
            name: "bold",
            icon: Bold,
            command: () => editor.chain().focus().toggleBold().run(),
            isActive: () => editor.isActive("bold"),
        },
        {
            name: "italic",
            icon: Italic,
            command: () => editor.chain().focus().toggleItalic().run(),
            isActive: () => editor.isActive("italic"),
        },
        {
            name: "strike",
            icon: Strikethrough,
            command: () => editor.chain().focus().toggleStrike().run(),
            isActive: () => editor.isActive("strike"),
        },
        {
            name: "code",
            icon: Code,
            command: () => editor.chain().focus().toggleCode().run(),
            isActive: () => editor.isActive("code"),
        },
        {
            name: "highlight",
            icon: Highlighter,
            command: () => editor.chain().focus().toggleHighlight().run(),
            isActive: () => editor.isActive("highlight"),
        }
    ]

    const setLink = () => {
        if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run()
            return
        }

        const previousUrl = editor.getAttributes('link').href
        setLinkUrl(previousUrl || '')
        setIsLinkOpen(true)
    }

    const commitLink = () => {
        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
        }
        setIsLinkOpen(false)
    }

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="flex overflow-hidden rounded-md border bg-popover shadow-md"
        >
            {isLinkOpen ? (
                <div className="flex items-center p-1">
                    <input
                        type="text"
                        autoFocus
                        placeholder="Paste link..."
                        className="h-8 w-40 rounded-sm bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitLink()
                            if (e.key === 'Escape') setIsLinkOpen(false)
                        }}
                    />
                </div>
            ) : (
                <div className="flex p-1">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.command}
                            className={cn(
                                "p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground",
                                item.isActive() && "text-primary bg-muted font-medium"
                            )}
                            title={item.name}
                        >
                            <item.icon className="w-4 h-4" />
                        </button>
                    ))}

                    <div className="mx-1 w-px bg-border my-1" />

                    <button
                        onClick={setLink}
                        className={cn(
                            "p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground",
                            editor.isActive('link') && "text-primary bg-muted font-medium"
                        )}
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </BubbleMenu>
    )
}
