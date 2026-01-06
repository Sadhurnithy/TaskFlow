"use client"

import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function FirstWorkspaceSetup() {
    return (
        <CreateWorkspaceDialog>
            <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create your first workspace
            </Button>
        </CreateWorkspaceDialog>
    )
}
