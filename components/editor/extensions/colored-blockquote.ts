import Blockquote from '@tiptap/extension-blockquote'

export const ColoredBlockquote = Blockquote.extend({
    addAttributes() {
        return {
            color: {
                default: null,
                // Prioritize data-color, fallback to style
                parseHTML: element => element.getAttribute('data-color') || element.style.borderLeftColor,
                renderHTML: attributes => {
                    if (!attributes.color) {
                        return {}
                    }
                    return {
                        'data-color': attributes.color,
                        style: `border-left-color: ${attributes.color}; border-left-width: 4px; padding-left: 1rem; color: inherit`,
                    }
                },
                keepOnSplit: false,
            },
        }
    },
})
