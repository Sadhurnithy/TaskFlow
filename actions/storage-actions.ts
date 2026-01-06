"use server"

import { requireAuth } from "@/lib/auth/utils"
import crypto from "crypto"

const getCloudinaryConfig = () => {
    let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
    let apiKey = process.env.CLOUDINARY_API_KEY
    let apiSecret = process.env.CLOUDINARY_API_SECRET

    // Fallback: Parse CLOUDINARY_URL if individual keys are missing
    if ((!apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
        try {
            // cloudinary://api_key:api_secret@cloud_name
            const matcher = /cloudinary:\/\/([^:]+):([^@]+)@(.+)/
            const matches = process.env.CLOUDINARY_URL.match(matcher)
            if (matches) {
                apiKey = matches[1]
                apiSecret = matches[2]
                if (!cloudName) cloudName = matches[3]
            }
        } catch (e) {
            console.error("Failed to parse CLOUDINARY_URL", e)
        }
    }

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Missing Cloudinary configuration")
    }

    return { cloudName, apiKey, apiSecret }
}

export async function getCloudinarySignature() {
    const session = await requireAuth()
    if (!session.user) throw new Error("Unauthorized")

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()

    // Timestamp (UNIX time in seconds)
    const timestamp = Math.round((new Date()).getTime() / 1000)

    // Parameters to sign (ordered alphabetically)
    const params = {
        timestamp: timestamp,
    }

    console.log("Signing using config:", { cloudName, apiKeyPresent: !!apiKey })

    // Create signature string: key=value&key=value
    const signatureString = `timestamp=${timestamp}${apiSecret}`

    // Generate SHA1 signature
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    return { timestamp, signature, cloudName, apiKey }
}

export async function deleteFromCloudinary(files: string[] | { publicId: string, resourceType: string }[]) {
    const session = await requireAuth()
    if (!session) throw new Error("Unauthorized")

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()

    // Normalize input to array of objects
    const items = Array.isArray(files)
        ? files.map(f => typeof f === 'string' ? { publicId: f, resourceType: 'image' } : f)
        : [] // Should not happen given types

    if (items.length === 0) return []

    console.log(`Deleting ${items.length} items from Cloudinary...`)

    const results = await Promise.all(items.map(async (item) => {
        const { publicId, resourceType } = item
        const timestamp = Math.round(new Date().getTime() / 1000)

        // signature = hash(public_id=xxx&timestamp=xxx + secret)
        const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
        const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

        const formData = new FormData()
        formData.append("public_id", publicId)
        formData.append("timestamp", timestamp.toString())
        formData.append("api_key", apiKey)
        formData.append("signature", signature)

        try {
            // e.g. https://api.cloudinary.com/v1_1/cloud/video/destroy
            const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`

            const response = await fetch(url, {
                method: "POST",
                body: formData
            })
            const data = await response.json()

            if (!response.ok || data.result !== 'ok') {
                console.error(`Failed to delete ${publicId} (${resourceType}):`, data)
                return { id: publicId, success: false, error: data }
            }

            console.log(`Successfully deleted ${publicId}`)
            return { id: publicId, success: true, result: data.result }
        } catch (error) {
            console.error(`Error deleting ${publicId}:`, error)
            return { id: publicId, success: false, error }
        }
    }))

    return results
}
