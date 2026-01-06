"use client"

import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { Node } from "@tiptap/core"
import { FileText, ArrowUpRight } from "lucide-react"
import Link from "next/link"

const NoteEmbedComponent = ({ node, deleteNode }: any) => {
    const noteId = node.attrs.noteId

    // In a real app, you'd fetch note title/excerpt here or pass it as attrs
    // For now, we'll placeholder

    return (
        <NodeViewWrapper className="my-4">
            <Link href={`/workspace/default/notes/${noteId}`} className="block group">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                    <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <FileText className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            Linked Note Concept
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                            Click to navigate to note ID: {noteId}
                        </p>
                    </div>

                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </Link>
        </NodeViewWrapper>
    )
}

export const NoteEmbed = Node.create({
    name: "noteEmbed",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            noteId: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: "note-embed",
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ["note-embed", HTMLAttributes]
    },

    addNodeView() {
        return ReactNodeViewRenderer(NoteEmbedComponent)
    },
})
