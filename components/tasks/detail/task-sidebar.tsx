"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, User as UserIcon, Link as LinkIcon, X, Check, ChevronsUpDown, ArrowUp } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Priority, TaskStatus } from "@prisma/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

import { statusConfig, priorityConfig } from "@/components/tasks/task-detail-view"
import type { TaskWithRelations } from "@/types/task"

interface TaskSidebarProps {
    task: TaskWithRelations
    workspaceId: string
    status: TaskStatus
    setStatus: (status: TaskStatus) => void
    priority: Priority
    setPriority: (priority: Priority) => void
    dueDate: Date | undefined
    setDueDate: (date: Date | undefined) => void
    canEdit: boolean
    onUpdate: (data: Partial<any>) => void
    availableNotes: { id: string; title: string }[]
    workspaceSlug: string
}

export function TaskSidebar({
    task,
    workspaceId,
    status,
    setStatus,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    canEdit,
    onUpdate,
    availableNotes,
    workspaceSlug
}: TaskSidebarProps) {
    const router = useRouter()

    //Optimistic Linked Notes
    // We lift this up or keep it local? Local is fine for sidebar if we sync initial
    const [optimisticNotes, setOptimisticNotes] = React.useState<any[]>(task.notes || [])
    const [members, setMembers] = React.useState<any[]>([])

    React.useEffect(() => {
        const fetchMembers = async () => {
            const { getWorkspaceMembersAction } = await import("@/actions/workspace-actions")
            const result = await getWorkspaceMembersAction(workspaceId)
            setMembers(result)
        }
        if (canEdit) {
            fetchMembers()
        }
    }, [workspaceId, canEdit])

    React.useEffect(() => {
        setOptimisticNotes(task.notes || [])
    }, [task.notes])

    const handleNoteToggle = async (noteId: string, noteTitle: string) => {
        const isSelected = optimisticNotes.some(n => n.note.id === noteId)

        let newNotes: any[] = []
        if (isSelected) {
            newNotes = optimisticNotes.filter(n => n.note.id !== noteId)
        } else {
            // Mock the structure needed
            newNotes = [...optimisticNotes, { note: { id: noteId, title: noteTitle } }]
        }

        setOptimisticNotes(newNotes)

        // Calculate IDs for backend
        const noteIds = newNotes.map(n => n.note.id)

        // Update functionality
        onUpdate({ noteIds })
        // Note: onUpdate in parent might handle refresh, assuming it does.
    }


    return (
        <div className="space-y-6">
            {/* Status & Priority Card */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status & Priority</h4>

                <div className="grid grid-cols-1 gap-3">
                    {/* Status */}
                    <div onClick={() => !canEdit && toast.error("You do not have permission to update status")}>
                        <Select
                            value={status}
                            onValueChange={(v) => {
                                setStatus(v as TaskStatus)
                                onUpdate({ status: v as TaskStatus })
                            }}
                            disabled={!canEdit}
                        >
                            <SelectTrigger className="h-9 w-full bg-background border shadow-sm text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover/95 backdrop-blur-lg z-[100]">
                                {Object.values(TaskStatus).map(s => {
                                    const config = statusConfig[s]
                                    const Icon = config.icon
                                    return (
                                        <SelectItem key={s} value={s} className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("p-1 rounded-full", config.bg)}>
                                                    <Icon className={cn("h-3 w-3", config.color)} />
                                                </div>
                                                <span className="font-medium">{config.label}</span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                {/* Priority */}
                <div onClick={() => !canEdit && toast.error("You do not have permission to update priority")}>
                    <Select
                        value={priority}
                        onValueChange={(v) => {
                            setPriority(v as Priority)
                            onUpdate({ priority: v as Priority })
                        }}
                        disabled={!canEdit}
                    >
                        <SelectTrigger className="h-9 w-full bg-background border shadow-sm text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover/95 backdrop-blur-lg z-[100]">
                            {Object.values(Priority).map(p => {
                                const config = priorityConfig[p] || priorityConfig[Priority.NONE]
                                const Icon = config.icon
                                return (
                                    <SelectItem key={p} value={p} className="text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-1 rounded-full", config.bg)}>
                                                <Icon className={cn("h-3 w-3", config.color)} />
                                            </div>
                                            <span className="font-medium">{config.label}</span>
                                        </div>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>


            {/* Assignment & Date Card */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Details</h4>

                {/* Assignee */}
                <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-medium">Assignee</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={!canEdit}
                                role="combobox"
                                className={cn(
                                    "w-full justify-between h-9 px-2 text-xs bg-background border shadow-sm",
                                    !task.assignee && "text-muted-foreground",
                                    !canEdit && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                                        {task.assignee?.image ? (
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={task.assignee.image} />
                                                <AvatarFallback>{task.assignee.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <UserIcon className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                                        )}
                                    </div>
                                    <span className="truncate flex-1 font-medium">{task.assignee?.name || "Unassigned"}</span>
                                </div>
                                {canEdit && <ChevronsUpDown className="h-3 w-3 text-muted-foreground/30 shrink-0 ml-1" />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0 bg-popover/95 backdrop-blur-lg z-[100]" align="start">
                            <Command>
                                <CommandInput placeholder="Search member..." className="h-8 text-xs" />
                                <CommandList>
                                    <CommandEmpty>No member found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="unassigned"
                                            onSelect={() => {
                                                onUpdate({ assigneeId: null })
                                            }}
                                            className="text-xs"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="h-5 w-5 rounded-full border border-dashed flex items-center justify-center">
                                                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <span>Unassigned</span>
                                            </div>
                                            {!task.assignee && <Check className="ml-auto h-3 w-3" />}
                                        </CommandItem>
                                        {members.map((member) => (
                                            <CommandItem
                                                key={member.userId}
                                                value={member.user.name || member.user.email}
                                                onSelect={() => {
                                                    onUpdate({ assigneeId: member.userId })
                                                }}
                                                className="text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={member.user.image || undefined} />
                                                        <AvatarFallback>{member.user.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{member.user.name}</span>
                                                </div>
                                                {task.assignee?.id === member.userId && <Check className="ml-auto h-3 w-3" />}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-medium">Due Date</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                disabled={!canEdit}
                                className={cn(
                                    "w-full pl-3 text-left font-normal bg-background h-9 border shadow-sm text-xs",
                                    !dueDate && "text-muted-foreground",
                                    !canEdit && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-lg z-[100]" align="start">
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={(d) => {
                                    setDueDate(d)
                                    onUpdate({ dueDate: d })
                                }}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Access / Collaborators - Only show if there are shares */}
            {
                task.shares && task.shares.length > 0 && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collaborators</h4>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{task.shares.length}</Badge>
                        </div>
                        <div className="space-y-2">
                            {task.shares.map((share) => (
                                <div key={share.userEmail} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-background/50">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={share.user?.image || undefined} />
                                            <AvatarFallback className="text-[10px]">
                                                {share.user?.name?.[0] || share.userEmail?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-medium truncate">
                                                {share.user?.name || share.userEmail}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground truncate">
                                                {share.userEmail}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize font-normal bg-muted/50">
                                        {share.permission.toLowerCase()}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Linked Notes Card */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Linked Notes</h4>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{optimisticNotes.length}</Badge>
                </div>

                <ScrollArea className="h-[180px] w-full pr-3">
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {optimisticNotes.map(({ note }) => (
                                <motion.div
                                    key={note.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative flex items-center gap-2.5 p-2 rounded-lg border bg-background hover:border-primary/20 hover:shadow-sm transition-all"
                                >
                                    <div className="h-7 w-7 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                            {note.title.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">{note.title}</div>
                                    </div>
                                    {canEdit && (
                                        <button
                                            onClick={() => handleNoteToggle(note.id, note.title)}
                                            className="h-5 w-5 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all z-10"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                    <a
                                        href={`/workspace/${workspaceSlug}/notes/${note.id}`}
                                        className="absolute inset-0 z-0"
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('button')) {
                                                e.preventDefault()
                                            }
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {optimisticNotes.length === 0 && (
                            <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/5">
                                <LinkIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-xs text-muted-foreground">No notes linked</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {canEdit && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full text-xs h-8 border-dashed">
                                <LinkIcon className="mr-2 h-3 w-3" />
                                Link another note
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="Search notes..." className="h-8 text-xs" />
                                <CommandList>
                                    <CommandEmpty>No notes found.</CommandEmpty>
                                    <CommandGroup>
                                        {availableNotes.map((note) => {
                                            const isSelected = optimisticNotes.some(n => n.note.id === note.id)
                                            return (
                                                <CommandItem
                                                    value={note.title}
                                                    key={note.id}
                                                    onSelect={() => handleNoteToggle(note.id, note.title)}
                                                    className="text-xs py-2"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-3.5 w-3.5 text-primary transition-opacity",
                                                            isSelected ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {note.title}
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </div >
    )
}
