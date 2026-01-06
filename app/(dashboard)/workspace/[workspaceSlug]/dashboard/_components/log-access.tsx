"use client"

import { useEffect } from "react"
import { logWorkspaceAccess } from "@/actions/workspace-actions"

export function LogAccess({ workspaceId }: { workspaceId: string }) {
    useEffect(() => {
        logWorkspaceAccess(workspaceId)
    }, [workspaceId])

    return null
}
