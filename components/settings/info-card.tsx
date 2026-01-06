import { cn } from "@/lib/utils"

interface InfoCardProps {
    label: string
    value: string
    action?: React.ReactNode
    className?: string
}

export function InfoCard({ label, value, action, className }: InfoCardProps) {
    return (
        <div className={cn("flex items-center justify-between py-3", className)}>
            <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-sm text-muted-foreground">{value}</div>
            </div>
            {action && (
                <div className="ml-4 shrink-0">
                    {action}
                </div>
            )}
        </div>
    )
}
