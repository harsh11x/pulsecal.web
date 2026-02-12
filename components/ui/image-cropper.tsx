"use client"

import React, { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import getCroppedImg from "@/utils/canvasUtils"
import { Loader2 } from "lucide-react"

interface ImageCropperProps {
    imageSrc: string | null
    open: boolean
    onClose: () => void
    onCropComplete: (croppedImageBlob: Blob) => void
}

export function ImageCropper({ imageSrc, open, onClose, onCropComplete }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return

        try {
            setLoading(true)
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (croppedImage) {
                onCropComplete(croppedImage)
            }
            onClose()
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Profile Picture</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-80 bg-black/5 rounded-md overflow-hidden mt-4">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteCallback}
                            onZoomChange={onZoomChange}
                        />
                    )}
                </div>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Zoom</Label>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
