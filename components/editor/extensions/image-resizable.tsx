"use client"
import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React, { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { toast } from "sonner"
import { uploadToCloudinary } from "@/lib/utils/upload"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Crop, ImageIcon, AlignCenter, AlignLeft, AlignRight, Trash2 } from 'lucide-react'
import { cn } from "@/lib/utils"

// Helper to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.src = imageSrc
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(URL.createObjectURL(blob!))
        }, 'image/jpeg')
    })
}

export const ResizableImage = Node.create({
    name: 'resizableImage',
    group: 'block',
    content: 'inline*',
    draggable: true,
    isolating: true,

    addAttributes() {
        return {
            src: { default: null },
            alt: { default: null },
            width: { default: '100%' },
            align: { default: 'center' }, // left, center, right
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-type="resizable-image"]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'resizable-image' }), 0]
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageComponent)
    },
})

function ResizableImageComponent({ node, updateAttributes, deleteNode, selected }: any) {
    const [isCropOpen, setIsCropOpen] = useState(false)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const resizeRef = useRef<HTMLDivElement>(null)

    const handleCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const onCropSave = async () => {
        try {
            if (!node.attrs.src || !croppedAreaPixels) return
            const croppedImageBlobUrl = await getCroppedImg(node.attrs.src, croppedAreaPixels) // Returns blob:url

            // Upload to Cloudinary to make it permanent
            toast.info("Saving cropped image...")
            const response = await fetch(croppedImageBlobUrl)
            const blob = await response.blob()
            const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" })

            const url = await uploadToCloudinary(file)
            if (url) {
                updateAttributes({ src: url })
                toast.success("Image updated")
            } else {
                toast.error("Failed to upload cropped image")
            }
            setIsCropOpen(false)
        } catch (e) {
            console.error(e)
            toast.error("Error cropping image")
        }
    }

    // Simple drag resizing (width only for now)
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault()
        const startX = e.clientX
        // @ts-ignore
        const startWidth = resizeRef.current?.offsetWidth || 0
        const parentWidth = resizeRef.current?.parentElement?.offsetWidth || 1000

        const onMouseMove = (moveEvent: MouseEvent) => {
            const currentWidth = startWidth + (moveEvent.clientX - startX)
            const newWidthPercent = Math.min(100, Math.max(10, (currentWidth / parentWidth) * 100))
            updateAttributes({ width: `${newWidthPercent}%` })
        }

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    }

    // Touch resizing
    const handleTouchStart = (e: React.TouchEvent) => {
        // e.preventDefault() // Don't prevent default immediately if we want some native behavior, but usually we do for D&D
        if (e.touches.length === 0) return
        const touch = e.touches[0]
        if (!touch) return
        const startX = touch.clientX
        if (!resizeRef.current) return
        const startWidth = resizeRef.current.offsetWidth
        const parentElement = resizeRef.current.parentElement
        const parentWidth = parentElement ? parentElement.offsetWidth : 1000

        const onTouchMove = (moveEvent: TouchEvent) => {
            if (moveEvent.touches.length === 0) return
            const moveTouch = moveEvent.touches[0]
            if (!moveTouch) return
            const currentWidth = startWidth + (moveTouch.clientX - startX)
            const newWidthPercent = Math.min(100, Math.max(10, (currentWidth / parentWidth) * 100))
            updateAttributes({ width: `${newWidthPercent}%` })
        }

        const onTouchEnd = () => {
            document.removeEventListener('touchmove', onTouchMove)
            document.removeEventListener('touchend', onTouchEnd)
        }

        document.addEventListener('touchmove', onTouchMove)
        document.addEventListener('touchend', onTouchEnd)
    }

    const { src, width, align } = node.attrs

    return (
        <NodeViewWrapper className={cn(
            "resizable-image-wrapper relative group my-4 flex",
            align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
        )}>
            <div
                ref={resizeRef}
                className={cn(
                    "relative max-w-full transition-[width] duration-75",
                    selected ? "ring-2 ring-primary ring-offset-2" : ""
                )}
                style={{ width: width }}
            >
                {/* Image */}
                <img
                    src={src}
                    alt="Content"
                    className={cn(
                        "w-full h-auto rounded-lg shadow-sm",
                        !src && "min-h-[200px] bg-muted animate-pulse"
                    )}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        // Basic fallback text
                        const span = document.createElement('span');
                        span.className = "block p-4 text-sm text-muted-foreground bg-muted rounded border border-dashed text-center";
                        span.innerText = "❌ Image failed to load. Please re-upload.";
                        e.currentTarget.parentElement?.appendChild(span);
                    }}
                />

                {/* Overlay Controls (visible on hover or select) */}
                <div className={cn(
                    "absolute top-2 right-2 flex gap-1 transition-opacity bg-black/50 backdrop-blur rounded p-1",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => updateAttributes({ align: 'left' })}>
                        <AlignLeft className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => updateAttributes({ align: 'center' })}>
                        <AlignCenter className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => updateAttributes({ align: 'right' })}>
                        <AlignRight className="w-3 h-3" />
                    </Button>
                    <div className="w-px h-4 bg-white/20 mx-1 self-center" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setIsCropOpen(true)}>
                        <Crop className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20 hover:text-red-400" onClick={deleteNode}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>

                {/* Resize Handle */}
                <div
                    className={cn(
                        "absolute bottom-2 right-2 w-6 h-6 bg-white border border-neutral-300 rounded-full cursor-se-resize flex items-center justify-center shadow-md transition-opacity touch-none",
                        selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleTouchStart}
                >
                    <div className="w-1 h-3 bg-neutral-300 rounded-full" />
                </div>
            </div>

            {/* Crop Dialog */}
            <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
                <DialogContent className="sm:max-w-3xl w-[95vw] h-[80vh] flex flex-col rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Crop Image</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 relative bg-black/5 min-h-[300px] rounded-md overflow-hidden">
                        <Cropper
                            image={src}
                            crop={crop}
                            zoom={zoom}
                            aspect={4 / 3} // Default aspect, maybe make free?
                            onCropChange={setCrop}
                            onCropComplete={handleCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    <div className="py-4">
                        <label className="text-sm font-medium">Zoom</label>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(val) => setZoom(val[0] || 1)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="text-muted-foreground hover:bg-red-100 hover:text-red-600" onClick={() => setIsCropOpen(false)}>Cancel</Button>
                        <Button onClick={onCropSave} className="bg-blue-600 hover:bg-blue-700 text-white">Save Crop</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </NodeViewWrapper>
    )
}
