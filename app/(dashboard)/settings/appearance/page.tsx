"use client"

import { useTheme } from "next-themes"
import { SettingsCard } from "@/components/settings/settings-card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Moon, Sun, Monitor } from "lucide-react"
import { useEffect, useState } from "react"

export default function AppearancePage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-medium tracking-tight">Appearance</h3>
                    <p className="text-sm text-muted-foreground">
                        Customize the look and feel of the application.
                    </p>
                </div>
                <SettingsCard title="Theme" description="Select your preferred theme for the workspace.">
                    <div className="h-32 bg-muted rounded-md animate-pulse" />
                </SettingsCard>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-medium tracking-tight">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                    Customize the look and feel of the application.
                </p>
            </div>

            <SettingsCard title="Theme" description="Select your preferred theme for the workspace.">
                <RadioGroup
                    defaultValue={theme}
                    onValueChange={(val: string) => setTheme(val)}
                    className="grid grid-cols-3 gap-4"
                >
                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="light"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <Sun className="mb-3 h-6 w-6" />
                            <span className="font-medium">Light</span>
                            <RadioGroupItem value="light" id="light" className="sr-only" />
                        </Label>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="dark"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <Moon className="mb-3 h-6 w-6" />
                            <span className="font-medium">Dark</span>
                            <RadioGroupItem value="dark" id="dark" className="sr-only" />
                        </Label>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="system"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <Monitor className="mb-3 h-6 w-6" />
                            <span className="font-medium">System</span>
                            <RadioGroupItem value="system" id="system" className="sr-only" />
                        </Label>
                    </div>
                </RadioGroup>
            </SettingsCard>
        </div>
    )
}
