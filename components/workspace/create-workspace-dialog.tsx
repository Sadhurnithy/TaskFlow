"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createWorkspaceSchema } from "@/lib/validators/workspace"
import { createWorkspace } from "@/actions/workspace-actions"
import type { CreateWorkspaceInput } from "@/types/workspace"

interface CreateWorkspaceDialogProps {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateWorkspaceDialog({ children, open, onOpenChange }: CreateWorkspaceDialogProps) {
    const [isPending, setIsPending] = React.useState(false)
    const router = useRouter()
    // Internal state for controlled dialog if not controlled from parent
    const [internalOpen, setInternalOpen] = React.useState(false)

    const isControlled = open !== undefined
    const show = isControlled ? open : internalOpen
    const setShow = isControlled ? onOpenChange : setInternalOpen

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<CreateWorkspaceInput>({
        resolver: zodResolver(createWorkspaceSchema),
        defaultValues: {
            name: "",
            icon: "⚡",
            description: "",
        },
    })

    // Watch name to preview slug (simple client-side preview)
    const name = watch("name")
    const slugPreview = name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "workspace-slug"

    const onSubmit = async (data: CreateWorkspaceInput) => {
        setIsPending(true)
        try {
            const result = await createWorkspace(data)

            if (result.success && result.data) {
                toast.success("Workspace created successfully")
                setShow?.(false)
                reset()
                router.push(`/workspace/${result.data.slug}/dashboard`)
            } else {
                toast.error(result.error || "Failed to create workspace")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
            console.error(error)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workspace
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Workspace</DialogTitle>
                    <DialogDescription>
                        Workspaces are where your team collaborates. You can create as many as you like.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Workspace Name</Label>
                        <Input
                            id="name"
                            placeholder="Acme Corp."
                            autoFocus
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                        {name && (
                            <p className="text-xs text-muted-foreground">
                                URL: app.tasknotes.com/{slugPreview}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1 grid gap-2">
                            <Label htmlFor="icon">Icon</Label>
                            <div className="flex">
                                <div className="relative w-full">
                                    <Input
                                        id="icon"
                                        className="text-center text-lg"
                                        {...register("icon")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="A place for our engineering team..."
                            className="resize-none"
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <div className="flex flex-col-reverse sm:flex-row w-full justify-between items-center sm:justify-end gap-3 sm:gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setShow?.(false)}
                                disabled={isPending}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                            >
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Workspace
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
