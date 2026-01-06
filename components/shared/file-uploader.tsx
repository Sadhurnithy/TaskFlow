"use client"

import { useState, useRef } from "react"
import { getCloudinarySignature } from "@/actions/storage-actions"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface FileUploaderProps {
    onUploadComplete: (url: string) => void
    defaultUrl?: string | null
    accept?: string
    className?: string
}

export function FileUploader({ onUploadComplete, defaultUrl, accept = "image/*", className }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(defaultUrl || null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error("File size must be less than 10MB")
            return
        }

        setFile(selectedFile)

        // Show preview for images
        if (selectedFile.type.startsWith("image/")) {
            const objectUrl = URL.createObjectURL(selectedFile)
            setPreview(objectUrl)
        } else {
            setPreview(null)
        }

        // Auto-upload on selection
        uploadFile(selectedFile)
    }

    const uploadFile = async (fileToUpload: File) => {
        setIsUploading(true)
        try {
            // 1. Get Signature
            const { timestamp, signature, apiKey, cloudName } = await getCloudinarySignature()

            // 2. Prepare FormData
            const formData = new FormData()
            formData.append("file", fileToUpload)
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
                console.error("Cloudinary error:", data)
                throw new Error(data.error?.message || "Upload failed")
            }

            // 4. Success
            const secureUrl = data.secure_url
            onUploadComplete(secureUrl)
            if (!fileToUpload.type.startsWith("image/")) {
                toast.success("File uploaded")
            }
        } catch (error) {
            console.error(error)
            toast.error("Upload failed. Please try again.")
            // Revert preview if failed
            if (defaultUrl) setPreview(defaultUrl)
            else setPreview(null)
        } finally {
            setIsUploading(false)
        }
    }

    const clearSelection = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setFile(null)
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        onUploadComplete("") // Optional: Clear URL in parent
    }

    const triggerSelect = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className={className}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={accept}
                onChange={handleFileChange}
            />

            {preview ? (
                <div className="relative group inline-block">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background shadow-sm">
                        <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="object-cover"
                        />
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                        )}
                    </div>

                    {!isUploading && (
                        <button
                            onClick={clearSelection}
                            className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                    <div
                        onClick={triggerSelect}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                    >
                        <Upload className="h-6 w-6 text-white" />
                    </div>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    onClick={triggerSelect}
                    disabled={isUploading}
                    className="gap-2"
                >
                    {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4" />
                    )}
                    {isUploading ? "Uploading..." : "Upload Image"}
                </Button>
            )}
        </div>
    )
}
