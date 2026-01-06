import { SettingsSidebar } from "@/components/settings/settings-sidebar"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Settings - TaskNotes",
    description: "Manage your account settings and preferences.",
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container max-w-6xl mx-auto py-10 px-4 md:px-8">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <SettingsSidebar />
                <div className="flex-1 lg:max-w-3xl">
                    {children}
                </div>
            </div>
        </div>
    )
}
