/**
 * Extracts the Cloudinary Public ID and Resource Type from a URL.
 * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/my_image.jpg
 * Returns: { publicId: "folder/my_image", resourceType: "image" }
 */
export function extractCloudinaryInfo(url: string): { publicId: string, resourceType: string } | null {
    if (!url.includes("cloudinary.com")) return null

    try {
        // Regex to match resource_type and public_id
        // structure: .../resource_type/type/upload/(v.../)?public_id.ext
        // matches: .../image/upload/v123/myid.jpg

        const regex = /cloudinary\.com\/[^/]+\/([^/]+)\/[^/]+\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/

        const match = url.match(regex)
        if (match && match[1] && match[2]) {
            return {
                resourceType: match[1],
                publicId: match[2]
            }
        }
    } catch (e) {
        console.error("Failed to extract Cloudinary info", e)
    }
    return null
}

// Keep for backward compatibility if needed, but we will replace usage
export function extractPublicIdFromUrl(url: string): string | null {
    const info = extractCloudinaryInfo(url)
    return info ? info.publicId : null
}

/**
 * Recursively traverses Tiptap content to find all Cloudinary URLs.
 * Returns a Map of Public ID -> Resource Type
 */
export function getCloudinaryFiles(content: any): Map<string, string> {
    const files = new Map<string, string>()

    if (!content) return files

    // If array (fragment)
    if (Array.isArray(content)) {
        content.forEach(item => {
            const childFiles = getCloudinaryFiles(item)
            childFiles.forEach((type, id) => files.set(id, type))
        })
        return files
    }

    // If object (node)
    if (typeof content === 'object') {
        const type = content.type

        const targetTypes = ['image', 'resizableImage', 'attachment']

        if (targetTypes.includes(type)) {
            let src = null
            try {
                // Safeguard against Next.js Client Reference Proxies
                src = content.attrs?.src
            } catch (e) {
                // Ignore proxy access errors
            }

            if (src) {
                const info = extractCloudinaryInfo(src)
                if (info) files.set(info.publicId, info.resourceType)
            }
        }

        // Check for marks (links)
        if (content.marks) {
            content.marks.forEach((mark: any) => {
                let href = null
                try {
                    href = mark.attrs?.href
                } catch (e) { }

                if (mark.type === 'link' && href) {
                    const info = extractCloudinaryInfo(href)
                    if (info) files.set(info.publicId, info.resourceType)
                }
            })
        }

        // Recurse into content
        if (content.content) {
            const childFiles = getCloudinaryFiles(content.content)
            childFiles.forEach((type, id) => files.set(id, type))
        }
    }

    return files
}

// Wrapper to match old signature for now, but returns just IDs
export function getCloudinaryIdsFromContent(content: any): Set<string> {
    const files = getCloudinaryFiles(content)
    return new Set(files.keys())
}
