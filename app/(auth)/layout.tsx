import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import '@/app/globals.css'
import { cn } from '@/lib/utils'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] p-4 relative overflow-hidden">
            {/* Dynamic Abstract Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/40 to-purple-100/40 blur-[100px] rounded-full"></div>
            </div>

            {/* Main Content Container (Centered) */}
            <div className="relative z-10 w-full max-w-md">
                {children}
            </div>
        </div>
    )
}
