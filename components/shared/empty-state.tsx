import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
    actionComponent?: React.ReactNode
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    actionComponent
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mb-4 mt-2 max-w-sm text-sm text-muted-foreground">
                {description}
            </p>
            {actionComponent ? (
                actionComponent
            ) : actionLabel && onAction ? (
                <Button onClick={onAction} variant="outline">
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    )
}
