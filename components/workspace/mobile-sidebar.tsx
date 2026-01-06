"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

export function MobileSidebar({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close sidebar on route change
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-md border border-border/50">
                    <Menu className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                {children}
            </SheetContent>
        </Sheet>
    )
}
