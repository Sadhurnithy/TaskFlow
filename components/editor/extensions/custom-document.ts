import Document from '@tiptap/extension-document'

export const CustomDocument = Document.extend({
    addAttributes() {
        return {
            textColor: {
                default: null,
                parseHTML: element => element.style.color,
                renderHTML: attributes => {
                    if (!attributes.textColor) {
                        return {}
                    }
                    return {
                        style: `color: ${attributes.textColor}`,
                    }
                },
            },
        }
    },
})
