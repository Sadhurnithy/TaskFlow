import Blockquote from '@tiptap/extension-blockquote'

export const ColoredBlockquote = Blockquote.extend({
    addAttributes() {
        return {
            color: {
                default: null,
                parseHTML: element => element.style.borderLeftColor || element.getAttribute('data-color'),
                renderHTML: attributes => {
                    if (!attributes.color) {
                        return {}
                    }
                    return {
                        'data-color': attributes.color,
                        style: `border-left-color: ${attributes.color}; border-left-width: 4px; padding-left: 1rem; color: ${attributes.color}`, // Also text color? Maybe just border. User said "colour picker to quotes too". Usually implies border color for quotes.
                        // Let's set border color and maybe text color slightly tinted? Default to just border for now + text color if desired. 
                        // Actually, usually quote color implies the vertical bar.
                    }
                },
            },
        }
    },
})
