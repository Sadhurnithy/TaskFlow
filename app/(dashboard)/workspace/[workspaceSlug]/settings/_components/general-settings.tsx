"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateWorkspaceSchema } from "@/lib/validators/workspace"
import { updateWorkspace } from "@/actions/workspace-actions"
import type { UpdateWorkspaceInput } from "@/types/workspace"

interface GeneralSettingsProps {
    workspace: {
        id: string
        name: string
        slug: string
        description: string | null
        icon: string | null
    }
}

export function GeneralSettings({ workspace }: GeneralSettingsProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    // Manual form state since I didn't verify Shadcn Form component creation.
    // Using creating components manual.

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty }
    } = useForm<UpdateWorkspaceInput>({
        resolver: zodResolver(updateWorkspaceSchema),
        defaultValues: {
            name: workspace.name,
            description: workspace.description || "",
            icon: workspace.icon || "⚡",
        }
    })

    const onSubmit = async (data: UpdateWorkspaceInput) => {
        setIsPending(true)
        try {
            const result = await updateWorkspace(workspace.id, data)
            if (result.success) {
                toast.success("Workspace updated successfully")
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="grid gap-6">
            <div className="grid gap-2">
                <h3 className="text-lg font-medium">Workspace Name</h3>
                <p className="text-sm text-muted-foreground">
                    This is your workspace's visible name and unique slug.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
                <div className="grid gap-2">
                    <Label htmlFor="name" className="font-semibold">Name</Label>
                    <Input
                        id="name"
                        {...register("name")}
                        className="bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="slug" className="font-semibold">Slug Strategy</Label>
                    <Input
                        disabled
                        value={workspace.slug}
                        className="bg-muted/50 border-primary/10 text-muted-foreground"
                    />
                    <p className="text-[10px] text-muted-foreground">Slugs cannot be changed after creation currently.</p>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description" className="font-semibold">Description</Label>
                    <Textarea
                        id="description"
                        {...register("description")}
                        className="bg-background/50 border-primary/20 focus-visible:ring-primary/30 min-h-[100px]"
                    />
                    {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                </div>

                <Button
                    type="submit"
                    disabled={isPending || !isDirty}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 disabled:bg-muted disabled:text-muted-foreground"
                >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </form>
        </div>
    )
}
