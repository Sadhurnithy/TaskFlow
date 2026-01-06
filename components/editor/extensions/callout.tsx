"use client"

import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { Node, mergeAttributes } from "@tiptap/core"
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const CalloutComponent = ({ node, updateAttributes }: any) => {
    const type = node.attrs.type || "info"

    const icons = {
        info: Info,
        warning: AlertTriangle,
        success: CheckCircle,
        error: XCircle,
    }

    const styles = {
        info: "bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200",
        warning: "bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200",
        success: "bg-green-50 border-green-100 text-green-900 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200",
        error: "bg-red-50 border-red-100 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200",
    }

    const Icon = icons[type as keyof typeof icons] || Info
    const style = styles[type as keyof typeof styles] || styles.info

    return (
        <NodeViewWrapper className={cn("flex gap-3 p-4 my-4 rounded-lg border", style)}>
            <div className="flex-shrink-0 mt-0.5 select-none" contentEditable={false}>
                <Icon className="w-5 h-5 opacity-80" />
            </div>
            <NodeViewContent className="flex-1 min-w-0 prose-sm dark:prose-invert focus:outline-none" />
        </NodeViewWrapper>
    )
}

export const Callout = Node.create({
    name: "callout",
    group: "block",
    content: "inline*",
    defining: true,

    addAttributes() {
        return {
            type: {
                default: "info",
                parseHTML: (element) => element.getAttribute("data-type"),
                renderHTML: (attributes) => ({ "data-type": attributes.type }),
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="callout"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-type": "callout" }), 0]
    },

    addNodeView() {
        return ReactNodeViewRenderer(CalloutComponent)
    },
})
