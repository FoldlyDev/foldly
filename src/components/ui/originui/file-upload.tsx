"use client"

import * as React from "react"
import { AlertCircleIcon, FileIcon, UploadIcon, XIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { useFileUpload, type FileWithPreview } from "@/hooks/utility/use-file-upload"
import { Button } from "@/components/ui/shadcn/button"
import { cn } from "@/lib/utils"

// =============================================================================
// SHARED TYPES
// =============================================================================

export interface BaseFileUploadProps {
  /** Maximum file size in MB (default: 2) */
  maxSizeMB?: number
  /** Accepted file types (default: "image/*") */
  accept?: string
  /** Callback when files change */
  onFilesChange?: (files: FileWithPreview[]) => void
  /** Callback when new files are added */
  onFilesAdded?: (files: FileWithPreview[]) => void
  /** Custom icon for empty state (default: FileIcon) */
  icon?: LucideIcon
  /** Title text for empty state */
  title?: string
  /** Description text for empty state */
  description?: string
  /** Button text */
  buttonText?: string
  /** Disabled state */
  disabled?: boolean
  /** Custom className for wrapper */
  className?: string
  /** Aria label for input */
  ariaLabel?: string
}

export interface SingleFileUploadProps extends BaseFileUploadProps {
  /** Show image preview for image files (default: true) */
  showPreview?: boolean
}

export interface MultipleFileUploadProps extends BaseFileUploadProps {
  /** Maximum number of files allowed (default: Infinity) */
  maxFiles?: number
  /** Show upload progress per file (default: false) */
  showProgress?: boolean
  /** Upload progress map (file id -> percentage) */
  uploadProgress?: Record<string, number>
}

// =============================================================================
// SINGLE FILE UPLOAD COMPONENT
// =============================================================================

/**
 * Single file upload component with large preview
 * Best for: Profile pictures, logos, single document uploads
 *
 * @example
 * ```tsx
 * <SingleFileUpload
 *   accept="image/*"
 *   maxSizeMB={5}
 *   onFilesChange={(files) => handleUpload(files)}
 * />
 * ```
 */
export function SingleFileUpload({
  maxSizeMB = 2,
  accept = "image/*",
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
}: SingleFileUploadProps) {
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
    multiple: false,
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

// =============================================================================
// MULTIPLE FILE UPLOAD COMPONENT
// =============================================================================

/**
 * Multiple file upload component with listed layout and inline previews
 * Best for: Batch document uploads, workspace file uploads
 *
 * @example
 * ```tsx
 * <MultipleFileUpload
 *   accept="*"
 *   maxFiles={10}
 *   maxSizeMB={5}
 *   onFilesChange={(files) => handleBatchUpload(files)}
 * />
 * ```
 */
export function MultipleFileUpload({
  maxSizeMB = 2,
  accept = "*",
  maxFiles = Infinity,
  onFilesChange,
  onFilesAdded,
  showProgress = false,
  uploadProgress = {},
  icon: Icon = FileIcon,
  title,
  description,
  buttonText,
  disabled = false,
  className,
  ariaLabel = "Upload files",
}: MultipleFileUploadProps) {
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
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    accept,
    maxSize,
    maxFiles,
    multiple: true,
    onFilesChange,
    onFilesAdded,
  })

  // Auto-generate title based on file type
  const defaultTitle = React.useMemo(() => {
    if (accept.includes("image")) return "Drop your images here"
    if (accept.includes("video")) return "Drop your videos here"
    if (accept.includes("audio")) return "Drop your audio files here"
    if (accept.includes("pdf")) return "Drop your PDFs here"
    return "Drop your files here"
  }, [accept])

  // Auto-generate description
  const defaultDescription = React.useMemo(() => {
    const types: string[] = []
    if (accept.includes("image")) types.push("Images")
    if (accept.includes("video")) types.push("Videos")
    if (accept.includes("audio")) types.push("Audio")
    if (accept.includes("pdf")) types.push("PDFs")
    if (accept === "*" || types.length === 0) types.push("All files")

    const maxFilesText = maxFiles === Infinity ? "" : `, up to ${maxFiles} files`
    return `${types.join(", ")} (max. ${maxSizeMB}MB${maxFilesText})`
  }, [accept, maxSizeMB, maxFiles])

  // Auto-generate button text
  const defaultButtonText = React.useMemo(() => {
    if (accept.includes("image")) return "Select images"
    if (accept.includes("video")) return "Select videos"
    if (accept.includes("audio")) return "Select audio"
    if (accept.includes("pdf")) return "Select PDFs"
    return "Select files"
  }, [accept])

  const getFileIcon = (file: File | { type: string }) => {
    const type = file.type
    if (type.startsWith("image/")) return "🖼️"
    if (type.startsWith("video/")) return "🎬"
    if (type.startsWith("audio/")) return "🎵"
    if (type.includes("pdf")) return "📄"
    if (type.includes("zip") || type.includes("rar")) return "📦"
    if (type.includes("document") || type.includes("word")) return "📝"
    if (type.includes("sheet") || type.includes("excel")) return "📊"
    return "📄"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Drop area */}
      <div
        onDragEnter={disabled ? undefined : handleDragEnter}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDragOver={disabled ? undefined : handleDragOver}
        onDrop={disabled ? undefined : handleDrop}
        data-dragging={isDragging || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "relative flex min-h-40 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-input p-4 transition-colors",
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
        {files.length === 0 ? (
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
        ) : (
          <div className="w-full space-y-2">
            {/* File list */}
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {files.map((fileWithPreview) => {
                const file = fileWithPreview.file
                const isImage = file.type.startsWith("image/")
                const isVideo = file.type.startsWith("video/")
                const progress = uploadProgress[fileWithPreview.id]

                return (
                  <div
                    key={fileWithPreview.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-2 transition-colors hover:bg-accent/50"
                  >
                    {/* Thumbnail/Icon */}
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                      {isImage && fileWithPreview.preview ? (
                        <img
                          src={fileWithPreview.preview}
                          alt={file.name}
                          className="size-full object-cover"
                        />
                      ) : isVideo && fileWithPreview.preview ? (
                        <video
                          src={fileWithPreview.preview}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-lg" aria-hidden="true">
                          {getFileIcon(file)}
                        </span>
                      )}
                    </div>

                    {/* File info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      {showProgress && progress !== undefined && (
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    {!disabled && (
                      <button
                        type="button"
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeFile(fileWithPreview.id)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <XIcon className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add more button */}
            {!disabled && (maxFiles === Infinity || files.length < maxFiles) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={openFileDialog}
                type="button"
              >
                <UploadIcon
                  className="-ms-1 size-4 opacity-60"
                  aria-hidden="true"
                />
                Add more files
              </Button>
            )}

            {/* Clear all button */}
            {!disabled && files.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={clearFiles}
                type="button"
              >
                Clear all ({files.length})
              </Button>
            )}
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

