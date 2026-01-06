"use client"

import { Editor } from "@tiptap/react"
import {
    Bold, Italic, Strikethrough, Code, Link as LinkIcon,
    Highlighter, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Undo, Redo,
    Image as ImageIcon, Minus, Upload, X, Check, Baseline, MoreHorizontal,
    ChevronDown, ChevronUp
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { uploadToCloudinary } from "@/lib/utils/upload"
import { useRef, useState, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface FixedMenuBarProps {
    editor: Editor
}

const HIGHLIGHT_COLORS = [
    { color: '#000000', label: 'Black' },
    { color: '#ffffff', label: 'White' },
    { color: '#ffc078', label: 'Orange' },
    { color: '#8ce99a', label: 'Green' },
    { color: '#74c0fc', label: 'Blue' },
    { color: '#b197fc', label: 'Purple' },
    { color: '#fea3aa', label: 'Red' },
    { color: '#ffff00', label: 'Yellow' }
]

export function FixedMenuBar({ editor }: FixedMenuBarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isLinkOpen, setIsLinkOpen] = useState(false)
    const [linkUrl, setLinkUrl] = useState("")

    if (!editor) return null

    // Prevent button from taking focus
    const preventFocus = (e: React.MouseEvent | React.TouchEvent) => {
        // We only need this for simple buttons. PopoverTrigger handles its own focus.
        e.preventDefault()
    }

    const openLinkPopover = () => {
        const previousUrl = editor.getAttributes('link').href || ""
        setLinkUrl(previousUrl)
        setIsLinkOpen(true)
    }

    const saveLink = () => {
        if (linkUrl) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
        } else {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
        }
        setIsLinkOpen(false)
        setLinkUrl("")
    }

    const applyHighlight = (color: string) => {
        editor.chain().focus().setHighlight({ color }).run()
        // Popover closes automatically if we don't control it, or we click outside
    }

    const unhighlight = () => {
        editor.chain().focus().unsetHighlight().run()
    }

    const handleImageUpload = () => {
        fileInputRef.current?.click()
    }

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const LOADING_TOAST = toast.loading('Uploading...')

        try {
            const url = await uploadToCloudinary(file)

            toast.dismiss(LOADING_TOAST)

            if (url) {
                toast.success('File uploaded')
                if (file.type.startsWith('image/')) {
                    editor.chain().focus().insertContent({ type: 'resizableImage', attrs: { src: url } }).run()
                } else {
                    // Insert Attachment (Video or PDF or File)
                    editor.chain().focus().insertContent({
                        type: 'attachment',
                        attrs: {
                            src: url,
                            type: file.type,
                            name: file.name
                        }
                    }).run()
                }
            } else {
                toast.error('Upload failed')
            }
        } catch (error) {
            toast.dismiss(LOADING_TOAST)
            toast.error('Upload failed')
            console.error(error)
        }

        e.target.value = ''
    }

    const MenuBtn = ({
        isActive, onClick, children, title, disabled, onMouseDown
    }: {
        isActive?: boolean
        onClick?: () => void
        children: React.ReactNode
        title: string
        disabled?: boolean
        onMouseDown?: (e: any) => void
    }) => (
        <button
            type="button"
            onMouseDown={onMouseDown ?? preventFocus}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 border border-input shadow-sm flex-shrink-0",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                    ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white dark:bg-white dark:text-neutral-900"
                    : "text-muted-foreground bg-background",
            )}
        >
            {children}
        </button>
    )

    // ... (previous code)

    return (
        <div className="relative z-50 sticky top-0 mb-4">
            <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex w-full">

                {/* Scrollable Content Area */}
                <div className="flex-1 px-2 py-2 flex items-center gap-1 min-w-0 flex-nowrap overflow-x-auto md:overflow-visible scrollbar-hide">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,application/pdf" onChange={onFileChange} />

                    <MenuBtn onClick={() => editor.commands.toggleBold()} isActive={editor.isActive("bold")} title="Bold"><Bold className="h-4 w-4" /></MenuBtn>
                    <MenuBtn onClick={() => editor.commands.toggleItalic()} isActive={editor.isActive("italic")} title="Italic"><Italic className="h-4 w-4" /></MenuBtn>
                    <MenuBtn onClick={() => editor.commands.toggleStrike()} isActive={editor.isActive("strike")} title="Strike"><Strikethrough className="h-4 w-4" /></MenuBtn>
                    <MenuBtn onClick={() => editor.commands.toggleCode()} isActive={editor.isActive("code")} title="Code"><Code className="h-4 w-4" /></MenuBtn>

                    {/* Text Color Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input shadow-sm flex-shrink-0",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    editor.getAttributes('textStyle').color
                                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                        : "text-muted-foreground bg-background"
                                )}
                                title="Text Color"
                            >
                                <Baseline className="h-4 w-4" />
                                <div className="h-1 w-4 absolute bottom-1 rounded-full" style={{ backgroundColor: editor.getAttributes('textStyle').color || 'transparent' }} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 flex gap-1" side="bottom" align="start">
                            <button onClick={() => editor.chain().focus().unsetColor().run()} className="h-6 w-6 rounded-full border border-muted flex items-center justify-center hover:bg-muted" title="Default">
                                <X className="h-3 w-3" />
                            </button>
                            {HIGHLIGHT_COLORS.map(({ color, label }) => (
                                <button
                                    key={color}
                                    onClick={() => editor.chain().focus().setColor(color).run()}
                                    className="h-6 w-6 rounded-full border border-black/10 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={label}
                                />
                            ))}
                        </PopoverContent>
                    </Popover>

                    {/* Highlight Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input shadow-sm flex-shrink-0",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    editor.isActive("highlight")
                                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                        : "text-muted-foreground bg-background"
                                )}
                                title="Highlight"
                            >
                                <Highlighter className="h-4 w-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 flex gap-1" side="bottom" align="start">
                            <button onClick={unhighlight} className="h-6 w-6 rounded-full border border-muted flex items-center justify-center hover:bg-muted" title="None">
                                <X className="h-3 w-3" />
                            </button>
                            {HIGHLIGHT_COLORS.map(({ color, label }) => (
                                <button
                                    key={color}
                                    onClick={() => applyHighlight(color)}
                                    className="h-6 w-6 rounded-full border border-black/10 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={label}
                                />
                            ))}
                        </PopoverContent>
                    </Popover>

                    <Separator orientation="vertical" className="h-6 mx-1 flex-shrink-0" />

                    <MenuBtn onClick={() => editor.commands.toggleHeading({ level: 1 })} isActive={editor.isActive("heading", { level: 1 })} title="H1"><Heading1 className="h-4 w-4" /></MenuBtn>
                    <MenuBtn onClick={() => editor.commands.toggleHeading({ level: 2 })} isActive={editor.isActive("heading", { level: 2 })} title="H2"><Heading2 className="h-4 w-4" /></MenuBtn>
                    <MenuBtn onClick={() => editor.commands.toggleHeading({ level: 3 })} isActive={editor.isActive("heading", { level: 3 })} title="H3"><Heading3 className="h-4 w-4" /></MenuBtn>

                    <Separator orientation="vertical" className="h-6 mx-1 flex-shrink-0" />

                    <MenuBtn onClick={() => editor.commands.toggleBulletList()} isActive={editor.isActive("bulletList")} title="Bullet List"><List className="h-4 w-4" /></MenuBtn>
                    <MenuBtn onClick={() => editor.commands.toggleOrderedList()} isActive={editor.isActive("orderedList")} title="Ordered List"><ListOrdered className="h-4 w-4" /></MenuBtn>

                    {/* Quote Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input shadow-sm flex-shrink-0",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    editor.isActive("blockquote")
                                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                        : "text-muted-foreground bg-background"
                                )}
                                title="Quote"
                            >
                                <Quote className="h-4 w-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 flex flex-col gap-3" side="bottom" align="start">
                            {/* Border Color */}
                            <div className="space-y-1.5">
                                <div className="text-xs font-medium text-muted-foreground flex justify-between items-center px-1">
                                    <span>Border Color</span>
                                    <button
                                        onClick={() => editor.chain().focus().updateAttributes('blockquote', { color: null }).run()}
                                        className="text-[10px] hover:text-foreground transition-colors"
                                    >
                                        Reset
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {HIGHLIGHT_COLORS.map(({ color, label }) => (
                                        <button
                                            key={`${color}-border`}
                                            onClick={() => editor.chain().focus().setBlockquote().updateAttributes('blockquote', { color }).run()}
                                            className="h-5 w-5 rounded-full border border-black/10 hover:scale-110 transition-transform ring-offset-1 focus:ring-2"
                                            style={{ backgroundColor: color }}
                                            title={label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <button
                                onClick={() => editor.chain().focus().unsetBlockquote().run()}
                                className="w-full text-xs h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                            >
                                Remove Quote
                            </button>
                        </PopoverContent>
                    </Popover>

                    <MenuBtn onClick={() => editor.commands.setHorizontalRule()} isActive={false} title="Horizontal Rule"><Minus className="h-4 w-4" /></MenuBtn>

                    <Separator orientation="vertical" className="h-6 mx-1 flex-shrink-0" />

                    {/* Link Popover */}
                    <Popover open={isLinkOpen} onOpenChange={setIsLinkOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                onClick={openLinkPopover}
                                className={cn(
                                    "h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input shadow-sm flex-shrink-0",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    editor.isActive("link")
                                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                        : "text-muted-foreground bg-background"
                                )}
                                title="Link"
                            >
                                <LinkIcon className="h-4 w-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2" side="bottom" align="start">
                            <div className="flex items-center gap-2">
                                <Input
                                    autoFocus
                                    placeholder="Paste link..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveLink()}
                                    className="h-8"
                                />
                                <Button size="sm" onClick={saveLink} className="h-8 px-2"><Check className="h-4 w-4" /></Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <MenuBtn onClick={handleImageUpload} isActive={false} title="Upload Image"><Upload className="h-4 w-4" /></MenuBtn>
                </div>

                {/* Fixed Action Area: Undo/Redo (Always Visible) */}
                <div className="flex-none p-2 flex items-center gap-1 border-l bg-background/50 backdrop-blur z-10 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                    <MenuBtn onClick={() => editor.commands.undo()} disabled={!editor.can().undo()} title="Undo" isActive={false}><Undo className="h-4 w-4" /></MenuBtn>
                    <MenuBtn onClick={() => editor.commands.redo()} disabled={!editor.can().redo()} title="Redo" isActive={false}><Redo className="h-4 w-4" /></MenuBtn>
                </div>
            </div>
        </div>
    )
}

