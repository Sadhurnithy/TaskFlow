"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar as CalendarIcon, Loader2, Plus, Check, ChevronsUpDown, X } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { createTaskSchema } from "@/lib/validators/task"
import { updateTask, createTask } from "@/actions/task-actions"
import { Priority, TaskStatus } from "@prisma/client"
import type { TaskWithRelations, AddTaskInput } from "@/types/task"

interface CreateTaskFormProps {
    workspaceId: string
    onSuccess?: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
    task?: TaskWithRelations
    children?: React.ReactNode
}

export function CreateTaskForm({ workspaceId, onSuccess, open, onOpenChange, trigger, task, children }: CreateTaskFormProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const [notes, setNotes] = React.useState<{ id: string; title: string }[]>([])
    const isControlled = open !== undefined
    const show = isControlled ? open : internalOpen
    const setShow = isControlled ? onOpenChange! : setInternalOpen

    const form = useForm<AddTaskInput>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            workspaceId,
            title: task?.title || "",
            description: task?.description || "",
            priority: task?.priority || Priority.MEDIUM,
            status: task?.status || TaskStatus.TODO,
            dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
            noteIds: task?.notes?.map(n => n.note.id) || []
        }
    })

    // Fetch notes when dialog opens
    React.useEffect(() => {
        if (show) {
            import("@/actions/note-actions").then(mod => {
                mod.getWorkspaceNotesForSelect(workspaceId).then(res => {
                    if (res.success && res.data) {
                        setNotes(res.data)
                    }
                })
            })
        }
    }, [show, workspaceId])

    const isPending = form.formState.isSubmitting

    async function onSubmit(data: AddTaskInput) {
        // Ensure workspaceId is set correctly in case default didn't take
        data.workspaceId = workspaceId

        let result
        if (task) {
            result = await updateTask(task.id, data)
        } else {
            result = await createTask(data)
        }

        if (result.success) {
            toast.success(task ? "Task updated" : "Task created")
            if (!task) form.reset() // Only reset on create, keep values on edit (or close dialog)
            setShow(false)
            onSuccess?.()
        } else {
            toast.error(result.error || (task ? "Failed to update task" : "Failed to create task"))
        }
    }

    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogTrigger asChild>
                {children || trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold tracking-tight">{task ? "Edit Task" : "Create New Task"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="Task title"
                                            className="text-lg font-medium border border-input/40 rounded-md px-3 py-2 shadow-sm focus-visible:ring-1 focus-visible:border-primary/50 bg-background/50 placeholder:text-muted-foreground/40"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Add details..."
                                            className="resize-none min-h-[100px] border border-input/40 bg-muted/20 rounded-md p-3 shadow-sm focus-visible:ring-1 focus-visible:bg-background transition-colors placeholder:text-muted-foreground/40"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4 pt-1">
                            {/* Priority & Status Row */}
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/50 border border-input/40 h-10 shadow-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span className="text-xs font-medium uppercase tracking-wider">Priority</span>
                                                        <span className="w-px h-3 bg-border" />
                                                        <SelectValue placeholder="Priority" className="text-foreground" />
                                                    </div>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl z-[100]">
                                                <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
                                                <SelectItem value={Priority.HIGH}>High</SelectItem>
                                                <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                                                <SelectItem value={Priority.LOW}>Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <Popover modal={true}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal bg-background/50 border border-input/40 h-10 shadow-sm",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 w-full">
                                                            <CalendarIcon className="h-4 w-4 opacity-50" />
                                                            {field.value ? (
                                                                <span className="text-foreground">{format(field.value, "MMM d, yyyy")}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">Set due date</span>
                                                            )}
                                                        </div>
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl z-[100]" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value || undefined}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Linked Notes Multi-Select */}
                        <FormField
                            control={form.control}
                            name="noteIds"
                            render={({ field }) => (
                                <FormItem>
                                    <Popover modal={true}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between bg-background/50 border border-input/40 h-auto min-h-[10px] py-2 px-3 shadow-sm",
                                                        !field.value?.length && "text-muted-foreground"
                                                    )}
                                                >
                                                    <div className="flex flex-wrap gap-1 items-center">
                                                        <span className="text-xs font-medium uppercase tracking-wider mr-2 shrink-0 text-muted-foreground">Linked Notes</span>
                                                        <span className="w-px h-3 bg-border shrink-0 mr-2" />
                                                        {field.value?.length ? (
                                                            field.value.map((noteId) => (
                                                                <Badge
                                                                    variant="secondary"
                                                                    key={noteId}
                                                                    className="mr-1 mb-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        const newValue = field.value?.filter((id) => id !== noteId)
                                                                        field.onChange(newValue)
                                                                    }}
                                                                >
                                                                    {notes.find((n) => n.id === noteId)?.title}
                                                                    <X className="ml-1 h-3 w-3 ring-offset-background rounded-full hover:bg-primary/20" />
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted-foreground">Select notes...</span>
                                                        )}
                                                    </div>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] sm:w-[400px] p-0 bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl z-[100]" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search notes..." />
                                                <CommandList>
                                                    <CommandEmpty>No notes found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {notes.map((note) => (
                                                            <CommandItem
                                                                value={note.title} // Search by title
                                                                key={note.id}
                                                                onSelect={() => {
                                                                    const currentValue = field.value || []
                                                                    const newValue = currentValue.includes(note.id)
                                                                        ? currentValue.filter((id) => id !== note.id)
                                                                        : [...currentValue, note.id]
                                                                    field.onChange(newValue)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        field.value?.includes(note.id)
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {note.title}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end pt-4 gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShow(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {task ? "Update Task" : "Create Task"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
