import { Node, Extension } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

// Placeholder for actual React components - to be implemented in frontend
const TaskEmbedComponent = () => null
const NoteEmbedComponent = () => null

export const TaskEmbed = Node.create({
    name: 'taskEmbed',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            taskId: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'task-embed',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['task-embed', HTMLAttributes]
    },

    // addNodeView() {
    //     return ReactNodeViewRenderer(TaskEmbedComponent)
    // }
})

export const NoteEmbed = Node.create({
    name: 'noteEmbed',
    group: 'block',
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
                tag: 'note-embed',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['note-embed', HTMLAttributes]
    },
})

export const Callout = Node.create({
    name: 'callout',
    content: 'block+',
    group: 'block',
    defining: true,

    addAttributes() {
        return {
            type: {
                default: 'info',
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
        return ['div', { 'data-type': 'callout', ...HTMLAttributes }, 0]
    },
})

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: { editor: any, range: any, props: any }) => {
                    props.command({ editor, range })
                },
            },
        }
    },
})
