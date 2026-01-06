import { Shield, ShieldAlert, User, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Role } from "@prisma/client"

interface RoleBadgeProps {
    role: Role | string
}

export function RoleBadge({ role }: RoleBadgeProps) {
    let icon = User
    let label = "Member"
    let className = "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200"

    switch (role) {
        case "OWNER":
            icon = ShieldAlert
            label = "Owner"
            className = "bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200"
            break
        case "ADMIN":
            icon = Shield
            label = "Admin"
            className = "bg-indigo-100 text-indigo-700 hover:bg-indigo-100/80 border-indigo-200"
            break
        case "MEMBER":
            icon = User
            label = "Member"
            className = "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200"
            break
        case "GUEST":
            icon = Eye
            label = "Guest"
            className = "bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200"
            break
    }

    const Icon = icon

    return (
        <Badge variant="outline" className={`gap-1 select-none ${className}`}>
            <Icon className="h-3 w-3" />
            <span>{label}</span>
        </Badge>
    )
}
