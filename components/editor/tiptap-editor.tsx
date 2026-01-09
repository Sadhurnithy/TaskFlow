"use client"

import { toast } from "sonner"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { common, createLowlight } from "lowlight"
import Highlight from "@tiptap/extension-highlight"
import CharacterCount from "@tiptap/extension-character-count"
import Typography from "@tiptap/extension-typography"
import Underline from "@tiptap/extension-underline"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"

import { EditorMenuBar } from "./editor-menu-bar"
import { FixedMenuBar } from "./fixed-menu-bar"
import { SlashCommand } from "./slash-command"
import { TaskEmbed } from "./extensions/task-embed"
import { NoteEmbed } from "./extensions/note-embed"
import { Callout } from "./extensions/callout"
import { DragHandle } from "./extensions/drag-handle"
import { Attachment } from "./extensions/attachment" // Imported
import { ColoredBlockquote } from "./extensions/colored-blockquote"
import { CustomDocument } from "./extensions/custom-document"
import { ResizableImage } from "./extensions/image-resizable"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { uploadToCloudinary } from "@/lib/utils/upload"

// const lowlight = createLowlight(common)

interface TipTapEditorProps {
    initialContent?: any
    editable?: boolean
    noteId?: string
    onChange?: (content: any) => Promise<any>
    note?: any
    notes?: any[]
    workspaceId?: string
    workspaceSlug?: string
}

export default function TipTapEditor({
    initialContent,
    editable = true,
    noteId,
    onChange,
    note,
    notes,
    workspaceId,
    workspaceSlug
}: TipTapEditorProps) {
    const [isSaving, setIsSaving] = useState(false)
    const onChangeRef = useRef(onChange)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Update ref when prop changes
    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    const editorContent = initialContent && initialContent.content && initialContent.content.length > 0
        ? initialContent
        : { type: 'doc', content: [{ type: 'paragraph' }] }

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                document: false, // We use CustomDocument
                codeBlock: false, // We use lowlight
                blockquote: false, // We use custom ColoredBlockquote
            }),
            CustomDocument,
            ColoredBlockquote,
            Underline,
            Placeholder.configure({
                placeholder: "Type '/' for commands...",
            }),
            Link.configure({
                openOnClick: true,
                autolink: true,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            }),
            ResizableImage,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            //   CodeBlockLowlight.configure({
            //     lowlight,
            //   }),
            Highlight.configure({
                multicolor: true,
            }),
            Typography,
            CharacterCount,

            // Custom Extensions
            TaskEmbed,
            NoteEmbed,
            Callout,
            SlashCommand,
            Attachment,
            TextStyle,
            Color,
        ],
        content: editorContent,
        editable,
        editorProps: {
            attributes: {
                class: cn(
                    "prose md:prose-sm dark:prose-invert max-w-none w-full max-w-full focus:outline-none min-h-[500px] px-4 py-4 md:px-12 md:py-6 break-words",
                    "prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl",
                    "prose-img:rounded-md prose-img:shadow-sm"
                ),
            },
            handleDrop: (view: any, event: any, slice: any, moved: boolean) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    const file = event.dataTransfer.files[0]
                    const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
                    if (!coordinates) return false

                    uploadToCloudinary(file).then(url => {
                        if (url) {
                            const { schema } = view.state
                            if (file.type.startsWith('image/')) {
                                const node = schema.nodes.image.create({ src: url })
                                const transaction = view.state.tr.insert(coordinates.pos, node)
                                view.dispatch(transaction)
                            } else {
                                // Insert as Attachment
                                const node = schema.nodes.attachment.create({
                                    src: url,
                                    type: file.type,
                                    name: file.name
                                })
                                const transaction = view.state.tr.insert(coordinates.pos, node)
                                view.dispatch(transaction)
                            }
                        }
                    })
                    return true
                }
                return false
            },
            handlePaste: (view: any, event: any, slice: any) => {
                if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
                    event.preventDefault()
                    const file = event.clipboardData.files[0]

                    uploadToCloudinary(file).then(url => {
                        if (url) {
                            const { schema } = view.state
                            if (file.type.startsWith('image/')) {
                                const node = schema.nodes.image.create({ src: url })
                                const transaction = view.state.tr.replaceSelectionWith(node)
                                view.dispatch(transaction)
                            } else {
                                // Insert as Attachment
                                const node = schema.nodes.attachment.create({
                                    src: url,
                                    type: file.type,
                                    name: file.name
                                })
                                const transaction = view.state.tr.replaceSelectionWith(node)
                                view.dispatch(transaction)
                            }
                        }
                    })
                    return true
                }
                return false
            }
        },
        onUpdate: ({ editor }) => {
            setIsSaving(true)
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

            saveTimeoutRef.current = setTimeout(async () => {
                if (onChangeRef.current) {
                    try {
                        const result = await onChangeRef.current(editor.getJSON())
                        // Check if result is an object with success property (ActionResponse)
                        if (result && typeof result === 'object' && 'success' in result && !result.success) {
                            toast.error("Failed to save changes")
                            console.error("Save failed:", result.error)
                            // Keep isSaving true or set error state?
                            // For now, let's just notify
                        }
                    } catch (error) {
                        toast.error("Failed to save changes")
                        console.error("Save error:", error)
                    } finally {
                        setIsSaving(false)
                    }
                }
            }, 500) // Reduced to 500ms for faster sync
        },
    })

    // Warn user if they try to leave while saving
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isSaving) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [isSaving])

    // Effect to update content if initialContent changes externally (e.g. reload)
    useEffect(() => {
        if (editor && initialContent && !editor.isDestroyed) {
            // Only set if completely empty to avoid overwriting work
            if (editor.isEmpty) {
                editor.commands.setContent(initialContent)
            }
        }
    }, [initialContent, editor])

    if (!editor) return null

    return (
        <div className="relative w-full mx-auto group pb-12 md:pb-12 md:border-2 md:border-dashed md:border-neutral-200 md:dark:border-neutral-800 md:rounded-xl md:p-4 p-0 border-none">
            {/* Saving Indicator */}
            <div className="absolute top-[-2rem] right-0 text-xs text-muted-foreground/50 transition-opacity duration-300 px-4">
                {isSaving ? "Saving..." : "Saved"}
            </div>

            {editable && <FixedMenuBar editor={editor} />}

            <div className="min-h-[500px] overflow-hidden">
                <EditorContent editor={editor} />
            </div>

            <div className="fixed bottom-4 right-4 text-xs text-muted-foreground opacity-50 hover:opacity-100 bg-background/80 backdrop-blur-sm p-1 rounded border z-50">
                {editor.storage.characterCount.words()} words
            </div>
        </div>
    )
}
