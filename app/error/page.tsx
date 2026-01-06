"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

export default function ErrorPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    let message = "An unknown error occurred."
    if (error === "Configuration") {
        message = "There is a problem with the server configuration. Please check your database connection or environment variables."
    } else if (error === "AccessDenied") {
        message = "You do not have permission to access this resource."
    } else if (error === "Verification") {
        message = "The sign in link is no longer valid. It may have been used already or it may have expired."
    }

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 p-6 text-center">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 ring-8 ring-red-50">
                <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>

            <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900">Authentication Error</h1>
            <code className="mb-6 rounded bg-zinc-200 px-2 py-1 text-sm font-mono text-zinc-600">Code: {error || "Unknown"}</code>

            <p className="mb-8 max-w-[450px] text-zinc-500">
                {message}
            </p>

            <div className="flex gap-4">
                <Button asChild variant="outline">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Go Home
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/login">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Link>
                </Button>
            </div>
        </div>
    )
}
