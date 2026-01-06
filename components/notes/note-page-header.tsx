"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    MoreHorizontal, Star, Share2, Trash2,
    ChevronRight, X, Circle, CheckCircle2, Clock, FileText, AlertCircle, Archive, Image as ImageIcon, Menu, ArrowLeft
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet"
import { NoteSidebar } from "./note-sidebar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useDebounce } from "@/hooks/use-debounce"
import { NoteShareDialog } from "./note-share-dialog"
import { ClientOnly } from "@/components/shared/client-only"
// import { NoteStatus } from "@prisma/client" // Avoid direct import if possible to keep client component light, or use generic string

enum NoteStatus {
    DRAFT = "DRAFT",
    IN_PROGRESS = "IN_PROGRESS",
    REVIEW = "REVIEW",
    COMPLETED = "COMPLETED",
    ARCHIVED = "ARCHIVED"
}

interface NotePageHeaderProps {
    note: any // NoteWithRelations
    onUpdate: (data: any) => void
    onDelete?: () => void
    notes?: any[]
    workspaceId?: string
    workspaceSlug?: string
    canEdit?: boolean
    currentUserRole?: string | null
}

const STATUS_CONFIG: Record<string, { label: string, icon: any, color: string }> = {
    [NoteStatus.DRAFT]: { label: "Draft", icon: FileText, color: "text-neutral-500" },
    [NoteStatus.IN_PROGRESS]: { label: "In Progress", icon: Clock, color: "text-blue-500" },
    [NoteStatus.REVIEW]: { label: "In Review", icon: AlertCircle, color: "text-yellow-500" },
    [NoteStatus.COMPLETED]: { label: "Completed", icon: CheckCircle2, color: "text-green-500" },
    [NoteStatus.ARCHIVED]: { label: "Archived", icon: Archive, color: "text-orange-500" },
}

import { RoleBadge } from "@/components/workspace/role-badge"

export function NotePageHeader({ note, onUpdate, onDelete, notes, workspaceId, workspaceSlug, canEdit = true, currentUserRole }: NotePageHeaderProps) {
    const [title, setTitle] = useState(note.title)
    const debouncedTitle = useDebounce(title, 800)
    const titleInputRef = useRef<HTMLInputElement>(null)

    // Sync local state if prop changes (remote update)
    useEffect(() => {
        setTitle(note.title)
    }, [note.title])

    // Trigger update on debounce
    useEffect(() => {
        if (debouncedTitle !== note.title) {
            onUpdate({ title: debouncedTitle })
        }
    }, [debouncedTitle]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleCoverChange = (url: string | null) => {
        onUpdate({ coverImage: url })
    }

    const toggleFavorite = () => {
        onUpdate({ isFavorite: !note.isFavorite })
    }

    const [status, setStatus] = useState(note.status || NoteStatus.DRAFT)

    useEffect(() => {
        setStatus(note.status || NoteStatus.DRAFT)
    }, [note.status])

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus)
        onUpdate({ status: newStatus })
    }

    // --- Render Helpers ---

    const CoverImageSection = () => {
        if (!note.coverImage) return null

        return (
            <div className="relative group w-[calc(100%+2rem)] -mx-4 md:w-full md:mx-auto md:max-w-[800px] md:rounded-xl md:overflow-hidden mb-6 transition-all">
                <div className="relative aspect-[3/1] md:aspect-[4/1] bg-muted">
                    <img
                        src={note.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />

                    {/* Hover Actions (Always visible on mobile, hover on desktop) */}
                    {/* Hover Actions (Always visible on mobile, hover on desktop) */}
                    {canEdit && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-6 text-[10px] sm:h-7 sm:text-xs bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-sm px-2"
                                    >
                                        Change Cover
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="end">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Cover Image URL</h4>
                                        <Input
                                            placeholder="https://images.unsplash.com..."
                                            defaultValue={note.coverImage || ""}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleCoverChange(e.currentTarget.value)
                                                }
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">Press Enter to save</p>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 text-[10px] sm:h-7 sm:text-xs bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-sm px-2"
                                onClick={() => handleCoverChange(null)}
                            >
                                <X className="w-3 h-3 mr-1" /> Remove
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        )
    }
    const StatusSection = () => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG[NoteStatus.DRAFT]!
        const Icon = config.icon

        return (
            <div className="flex items-center gap-2">
                <ClientOnly fallback={
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 gap-2 pl-2 pr-3 rounded-full border border-transparent", config.color)}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                    </Button>
                }>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canEdit}
                                className={cn("h-8 gap-2 pl-2 pr-3 rounded-full border border-transparent hover:border-border hover:bg-muted transition-all", config.color, !canEdit && "opacity-100 cursor-default hover:bg-transparent hover:border-transparent")}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{config.label}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        {canEdit && (
                            <DropdownMenuContent align="start">
                                {Object.entries(STATUS_CONFIG).map(([s, conf]) => {
                                    const StatusIcon = conf.icon
                                    return (
                                        <DropdownMenuItem
                                            key={s}
                                            onClick={() => handleStatusChange(s)}
                                            className="gap-2 cursor-pointer"
                                        >
                                            <StatusIcon className={cn("w-4 h-4", conf.color)} />
                                            <span>{conf.label}</span>
                                            {status === s && <CheckCircle2 className="w-3 h-3 ml-auto opacity-50" />}
                                        </DropdownMenuItem>
                                    )
                                })}
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
                </ClientOnly>

                {!note.coverImage && canEdit && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCoverChange("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80")}
                    >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Add Cover
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className="group relative pt-4 md:pt-8 pb-4">
            {/* 1. Breadcrumbs & Actions Row (Moved to Top) */}
            <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground z-20 relative px-4 md:px-12">
                <div className="flex items-center gap-1 overflow-hidden min-w-0">
                    <div className="md:hidden mr-2 flex-shrink-0">
                        <Link href={`/workspace/${workspaceSlug}/notes`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground -ml-2">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                        <Link href={`/workspace/${note.workspaceId}/notes`} className="hover:underline hover:text-foreground whitespace-nowrap flex-shrink-0">
                            Notes
                        </Link>
                        {note.parent && (
                            <>
                                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                <Link href={`/workspace/${note.workspaceId}/notes/${note.parent.id}`} className="truncate max-w-[80px] md:max-w-[150px] hover:text-foreground">
                                    {note.parent.title}
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {currentUserRole && <RoleBadge role={currentUserRole} />}

                    <span className="hidden md:inline-block text-[10px] md:text-xs mr-2 text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                        Edited {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>

                    {["OWNER", "ADMIN"].includes(currentUserRole || "") && (
                        <NoteShareDialog
                            noteId={note.id}
                            initialIsPublic={note.isPublic}
                            shares={note.shares}
                        />
                    )}

                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFavorite}>
                        <Star className={`w-4 h-4 ${note.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </Button>

                    {canEdit && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive cursor-pointer">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Note
                                </DropdownMenuItem>
                                {!note.coverImage && (
                                    <DropdownMenuItem onClick={() => handleCoverChange("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80")} className="cursor-pointer">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Add Random Cover
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                </div>
            </div>

            {/* 2. Cover Image */}
            <CoverImageSection />

            {/* 3. Title & Status Area */}
            <div className="max-w-[800px] w-full mx-auto space-y-4 px-4 md:px-12">
                <StatusSection />

                <Input
                    ref={titleInputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                        }
                    }}
                    readOnly={!canEdit}
                    onClick={() => !canEdit && toast.error("You do not have permission to edit this note")}
                    className={cn(
                        "text-3xl md:text-6xl font-bold bg-transparent px-0 py-2 rounded-none shadow-none focus-visible:ring-0 focus-visible:outline-none h-auto placeholder:text-muted-foreground/40 border-none",
                        !canEdit && "cursor-not-allowed"
                    )}
                    placeholder="Untitled Note"
                />
            </div>
        </div >
    )
}
