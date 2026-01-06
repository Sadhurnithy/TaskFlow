import { getCloudinarySignature } from "@/actions/storage-actions"
import { toast } from "sonner"

export async function uploadToCloudinary(file: File): Promise<string | null> {
    try {
        // 1. Get Signature
        const { timestamp, signature, apiKey, cloudName } = await getCloudinarySignature()

        // 2. Prepare FormData
        const formData = new FormData()
        formData.append("file", file)
        formData.append("api_key", apiKey)
        formData.append("timestamp", timestamp.toString())
        formData.append("signature", signature)

        // 3. Upload to Cloudinary
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
            method: "POST",
            body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("Cloudinary error status:", response.status, response.statusText)
            console.error("Cloudinary error data:", data)
            throw new Error(data.error?.message || `Upload failed with status ${response.status}`)
        }

        return data.secure_url
    } catch (error) {
        console.error("Upload failed details:", error)
        if (error instanceof Error) {
            toast.error(`Upload error: ${error.message}`)
        } else {
            toast.error("Upload failed due to network or server error.")
        }
        return null
    }
}
