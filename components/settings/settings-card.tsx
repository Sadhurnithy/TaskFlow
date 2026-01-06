import { cn } from "@/lib/utils"

interface SettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
    children: React.ReactNode
}

export function SettingsCard({ title, description, children, className, ...props }: SettingsCardProps) {
    return (
        <div className={cn("border border-border bg-card rounded-xl overflow-hidden shadow-sm", className)} {...props}>
            <div className="p-6">
                <div className="mb-6 space-y-1">
                    <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                <div className="space-y-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
