import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { FileText, Download, Play } from 'lucide-react'

export const Attachment = Node.create({
    name: 'attachment',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            type: {
                default: 'file',
            },
            name: {
                default: 'Attachment',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="attachment"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'attachment' })]
    },

    addNodeView() {
        return ReactNodeViewRenderer(AttachmentComponent)
    },
})

function AttachmentComponent({ node, getPos, editor }: any) {
    const { src, type, name } = node.attrs
    const isVideo = type?.startsWith('video/')
    const isPdf = type === 'application/pdf'

    if (isVideo) {
        return (
            <NodeViewWrapper className="attachment-node my-4 select-none">
                <div className="relative group max-w-sm rounded-lg overflow-hidden border border-border bg-black/5">
                    {/* Constant sized video player preview */}
                    <video
                        src={src}
                        controls
                        className="w-full max-h-[200px] object-cover"
                        preload="metadata"
                    />
                    <div className="p-2 text-xs text-muted-foreground bg-background/50 backdrop-blur truncate">
                        {name}
                    </div>
                </div>
            </NodeViewWrapper>
        )
    }

    if (isPdf) {
        return (
            <NodeViewWrapper className="attachment-node my-4 select-none">
                <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors max-w-md group"
                >
                    <div className="h-10 w-10 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:underline">{name}</p>
                        <p className="text-xs text-muted-foreground uppercase">PDF</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
            </NodeViewWrapper>
        )
    }

    // Fallback for other files
    return (
        <NodeViewWrapper className="attachment-node my-4 select-none">
            <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors max-w-md"
            >
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm truncate flex-1 block">{name}</span>
                <Download className="h-4 w-4 text-muted-foreground" />
            </a>
        </NodeViewWrapper>
    )
}
