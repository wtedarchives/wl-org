"use client"

import Image from "next/image"
import type { Dispatch, SetStateAction } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PosterFormFields } from "./poster-modal-form"

interface PosterFormImageSectionProps {
  formData: PosterFormFields
  setFormData: Dispatch<SetStateAction<PosterFormFields>>
  uploading: boolean
  onImageFile: (file: File | null) => void
  imagePreview: string | null
}

export function PosterFormImageSection({
  formData,
  setFormData,
  uploading,
  onImageFile,
  imagePreview,
}: PosterFormImageSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="poster-image-file">Image</Label>
      <Input
        id="poster-image-file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={uploading}
        className="h-11 cursor-pointer text-xs file:mr-3 file:border-0 file:bg-transparent file:text-xs sm:h-8"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          onImageFile(file)
        }}
      />
      <Input
        id="poster-image-url"
        type="url"
        value={formData.image}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, image: e.target.value }))
        }
        className="h-11 text-xs sm:h-8"
        placeholder="Or paste an image URL"
      />
      {uploading ? (
        <p className="text-xs text-muted-foreground">Uploading image…</p>
      ) : null}
      {imagePreview ? (
        <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-md border border-border">
          <Image
            src={imagePreview}
            alt="Poster preview"
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      ) : null}
    </div>
  )
}
