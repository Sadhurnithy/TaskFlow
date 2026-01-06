import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import ImageExtension from "@tiptap/extension-image"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Placeholder from "@tiptap/extension-placeholder"
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

import { TaskEmbed, NoteEmbed, Callout, SlashCommand } from "./custom-extensions"

export const defaultExtensions = [
    StarterKit.configure({
        bulletList: {
            keepMarks: true,
            keepAttributes: false,
        },
        orderedList: {
            keepMarks: true,
            keepAttributes: false,
        },
        heading: {
            levels: [1, 2, 3],
        },
    }),
    Link.configure({
        openOnClick: false,
        defaultProtocol: "https",
    }),
    ImageExtension.configure({
        inline: true,
        allowBase64: true,
    }),
    TaskList,
    TaskItem.configure({
        nested: true,
    }),
    Table.configure({
        resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TaskEmbed,
    NoteEmbed,
    Callout,
    SlashCommand,
    Placeholder.configure({
        placeholder: ({ node }) => {
            if (node.type.name === 'heading') {
                return 'Heading...'
            }
            return 'Type something, or type "/" for commands...'
        },
    }),
]
