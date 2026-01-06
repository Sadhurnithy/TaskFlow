"use client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { publishNote, unpublishNote, shareNote, removeShare } from "@/actions/note-actions"
import { toast } from "sonner"
import { Copy, Globe, Share2, Plus, X, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface NoteShareDialogProps {
    noteId: string
    initialIsPublic: boolean
    trigger?: React.ReactNode
    shares?: any[] // Todo: pass shares from parent
}

export function NoteShareDialog({ noteId, initialIsPublic, trigger, shares = [] }: NoteShareDialogProps) {
    const [isPublic, setIsPublic] = useState(initialIsPublic)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("people")
    const [email, setEmail] = useState("")
    const [permission, setPermission] = useState<"VIEW" | "EDIT">("VIEW")
    const [publicUrl, setPublicUrl] = useState<string | null>(
        initialIsPublic ? `${window.location.origin}/public/${noteId}` : null
    )

    const handleToggle = async (checked: boolean) => {
        setIsLoading(true)
        try {
            if (checked) {
                const response = await publishNote(noteId)
                if (!response.success) throw new Error(response.error)
                setPublicUrl(response.data || null)
                setIsPublic(true)
                toast.success("Note published to web")
            } else {
                const response = await unpublishNote(noteId)
                if (!response.success) throw new Error(response.error)
                setPublicUrl(null)
                setIsPublic(false)
                toast.success("Note unpublished")
            }
        } catch (error) {
            toast.error("Failed to update settings")
        } finally {
            setIsLoading(false)
        }
    }

    const handleInvite = async () => {
        if (!email) return
        setIsLoading(true)
        try {
            const res = await shareNote(noteId, email, permission)
            if (res.success) {
                toast.success("Invited " + email)
                setEmail("")
            } else {
                toast.error(res.error || "Failed to invite")
            }
        } catch (e) {
            toast.error("Error sending invite")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemove = async (email: string) => {
        if (!confirm("Remove access?")) return
        try {
            await removeShare(noteId, email)
            toast.success("Access removed")
        } catch (e) {
            toast.error("Failed to remove")
        }
    }


    const copyLink = () => {
        if (publicUrl) {
            navigator.clipboard.writeText(publicUrl)
            toast.success("Link copied")
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Share</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[95vw] rounded-xl">
                <DialogHeader>
                    <DialogTitle>Share Note</DialogTitle>
                    <DialogDescription>
                        Manage access and visibility.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                        <TabsTrigger
                            value="people"
                            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                        >
                            People
                        </TabsTrigger>
                        <TabsTrigger
                            value="publish"
                            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                        >
                            Publish
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="people" className="space-y-4 pt-4">
                        <div className="flex w-full items-center space-x-2">
                            <Input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-9"
                            />
                            <Select value={permission} onValueChange={(v: any) => setPermission(v)}>
                                <SelectTrigger className="w-[110px] h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIEW">Can View</SelectItem>
                                    <SelectItem value="EDIT">Can Edit</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleInvite}
                                disabled={isLoading || !email}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                            >
                                Invite
                            </Button>
                        </div>

                        <div className="space-y-3 mt-4">
                            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-1">People with access</Label>
                            {shares.length === 0 ? (
                                <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-lg text-center border border-dashed">
                                    No one invited yet.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {shares.map((share) => (
                                        <div key={share.userEmail} className="flex justify-between items-center text-sm p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                                                    {share.userEmail[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium truncate max-w-[140px] sm:max-w-[200px]">{share.userEmail}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{share.permission}</span>
                                                </div>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:bg-red-100 hover:text-red-600 rounded-full"
                                                onClick={() => handleRemove(share.userEmail)}
                                                title="Remove Access"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="publish" className="space-y-4 pt-4">
                        <div className="flex items-center justify-between space-x-2 rounded-xl border p-4 bg-muted/10">
                            <div className="flex flex-col space-y-1">
                                <Label className="text-base font-medium">Publish to Web</Label>
                                <span className="text-xs text-muted-foreground leading-snug max-w-[200px]">
                                    Anyone with the link can view this note.
                                </span>
                            </div>
                            <Switch
                                checked={isPublic}
                                onCheckedChange={handleToggle}
                                disabled={isLoading}
                                className="data-[state=checked]:bg-green-600"
                            />
                        </div>

                        {isPublic && publicUrl && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <div className="flex-1 p-2.5 rounded-lg border bg-muted/50 text-xs truncate font-mono text-foreground select-all">
                                    {publicUrl}
                                </div>
                                <Button size="icon" variant="outline" onClick={copyLink} title="Copy Link" className="h-9 w-9">
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="outline" onClick={() => window.open(publicUrl, '_blank')} title="Open Link" className="h-9 w-9">
                                    <Globe className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

