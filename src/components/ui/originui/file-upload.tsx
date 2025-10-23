"use client"

import * as React from "react"
import { AlertCircleIcon, FileIcon, UploadIcon, XIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { useFileUpload, type FileWithPreview } from "@/hooks/utility/use-file-upload"
import { Button } from "@/components/ui/shadcn/button"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export interface FileUploadProps {
  /** Maximum file size in MB (default: 2) */
  maxSizeMB?: number
  /** Accepted file types (default: "image/*") */
  accept?: string
  /** Allow multiple files (default: false) */
  multiple?: boolean
  /** Callback when files change */
  onFilesChange?: (files: FileWithPreview[]) => void
  /** Callback when new files are added */
  onFilesAdded?: (files: FileWithPreview[]) => void
  /** Show image preview for image files (default: true) */
  showPreview?: boolean
  /** Custom icon for empty state (default: FileIcon) */
  icon?: LucideIcon
  /** Title text for empty state */
  title?: string
  /** Description text for empty state */
  description?: string
  /** Button text (default: "Select file") */
  buttonText?: string
  /** Disabled state */
  disabled?: boolean
  /** Custom className for wrapper */
  className?: string
  /** Aria label for input */
  ariaLabel?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function FileUpload({
  maxSizeMB = 2,
  accept = "image/*",
  multiple = false,
  onFilesChange,
  onFilesAdded,
  showPreview = true,
  icon: Icon = FileIcon,
  title,
  description,
  buttonText,
  disabled = false,
  className,
  ariaLabel = "Upload file",
}: FileUploadProps) {
  const maxSize = maxSizeMB * 1024 * 1024

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept,
    maxSize,
    multiple,
    onFilesChange,
    onFilesAdded,
  })

  const previewUrl = files[0]?.preview || null
  const fileName = files[0]?.file.name || null

  // Auto-generate title based on file type
  const defaultTitle = React.useMemo(() => {
    if (accept.includes("image")) return "Drop your image here"
    if (accept.includes("video")) return "Drop your video here"
    if (accept.includes("audio")) return "Drop your audio here"
    if (accept.includes("pdf")) return "Drop your PDF here"
    return "Drop your file here"
  }, [accept])

  // Auto-generate description based on accept types
  const defaultDescription = React.useMemo(() => {
    const types: string[] = []
    if (accept.includes("image")) types.push("Images")
    if (accept.includes("video")) types.push("Videos")
    if (accept.includes("audio")) types.push("Audio")
    if (accept.includes("pdf")) types.push("PDFs")
    if (accept === "*" || types.length === 0) types.push("All files")

    return `${types.join(", ")} (max. ${maxSizeMB}MB)`
  }, [accept, maxSizeMB])

  // Auto-generate button text
  const defaultButtonText = React.useMemo(() => {
    if (accept.includes("image")) return "Select image"
    if (accept.includes("video")) return "Select video"
    if (accept.includes("audio")) return "Select audio"
    if (accept.includes("pdf")) return "Select PDF"
    return "Select file"
  }, [accept])

  const isImage = files[0]?.file.type?.startsWith("image/") || false

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative">
        {/* Drop area */}
        <div
          onDragEnter={disabled ? undefined : handleDragEnter}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDragOver={disabled ? undefined : handleDragOver}
          onDrop={disabled ? undefined : handleDrop}
          data-dragging={isDragging || undefined}
          data-disabled={disabled || undefined}
          className={cn(
            "relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-input p-4 transition-colors",
            "has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50",
            "data-[dragging=true]:bg-accent/50",
            "data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed"
          )}
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label={ariaLabel}
            disabled={disabled}
          />
          {showPreview && isImage && previewUrl ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img
                src={previewUrl}
                alt={fileName || "Uploaded image"}
                className="mx-auto max-h-full rounded object-contain"
              />
            </div>
          ) : files.length > 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
                aria-hidden="true"
              >
                <Icon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round((files[0]?.file.size || 0) / 1024)} KB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
                aria-hidden="true"
              >
                <Icon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">
                {title || defaultTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {description || defaultDescription}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={openFileDialog}
                disabled={disabled}
                type="button"
              >
                <UploadIcon
                  className="-ms-1 size-4 opacity-60"
                  aria-hidden="true"
                />
                {buttonText || defaultButtonText}
              </Button>
            </div>
          )}
        </div>

        {files.length > 0 && !disabled && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onClick={() => removeFile(files[0]?.id)}
              aria-label="Remove file"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="flex items-center gap-1 text-xs text-destructive"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  )
}
