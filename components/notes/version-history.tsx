"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, RotateCcw } from "lucide-react"

export function VersionHistory({ versions, onClose, onRestore }: any) {
    return (
        <div className="w-80 border-l h-screen bg-background flex flex-col absolute right-0 top-0 z-20 shadow-xl animate-in slide-in-from-right">
            <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2 font-semibold">
                    <History className="w-4 h-4" />
                    Version History
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {versions?.map((version: any) => (
                        <div key={version.id} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-sm font-medium">
                                        {new Date(version.createdAt).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        by {version.createdBy?.name || "Unknown"}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onRestore(version.id)}
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" /> Restore
                                </Button>
                            </div>

                            <div className="text-xs text-muted-foreground line-clamp-3 bg-muted p-2 rounded">
                                {/* Simple preview of content text content */}
                                {JSON.stringify(version.content).slice(0, 150)}...
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
