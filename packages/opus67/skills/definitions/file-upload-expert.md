# File Upload Expert

> **ID:** `file-upload-expert`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** supabase

## What This Skill Does

- Integrate UploadThing for managed file uploads
- Implement S3/R2 direct uploads with presigned URLs
- Optimize images on upload
- Handle video uploads with processing
- Track upload progress
- Build drag-and-drop interfaces
- Validate file types and sizes

## When to Use

This skill is automatically loaded when:

- **Keywords:** upload, file, image, video, s3, uploadthing, dropzone, storage
- **File Types:** N/A
- **Directories:** uploads/, storage/

## Core Capabilities

### 1. UploadThing Integration

Use UploadThing for the simplest file upload experience in Next.js.

**Best Practices:**
- Define file routes with type safety
- Set appropriate file size limits
- Handle upload errors gracefully
- Clean up orphaned files
- Use callbacks for post-upload processing

**Common Patterns:**

```typescript
// lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const uploadRouter = {
  // Profile image upload
  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Update user profile
      await db.user.update({
        where: { id: metadata.userId },
        data: { avatar: file.url },
      });
      return { url: file.url };
    }),

  // Document upload
  documents: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    "application/msword": { maxFileSize: "16MB" },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.document.create({
        data: {
          userId: metadata.userId,
          name: file.name,
          url: file.url,
          size: file.size,
        },
      });
    }),

  // Video upload
  video: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Trigger video processing job
      await processVideoJob.trigger({ fileUrl: file.url, userId: metadata.userId });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
```

```tsx
// components/upload-button.tsx
"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

export function ProfileImageUpload({
  onUploadComplete,
}: {
  onUploadComplete: (url: string) => void;
}) {
  return (
    <UploadButton<OurFileRouter, "profileImage">
      endpoint="profileImage"
      onClientUploadComplete={(res) => {
        if (res?.[0]) {
          onUploadComplete(res[0].url);
        }
      }}
      onUploadError={(error) => {
        console.error("Upload error:", error);
        toast.error("Upload failed");
      }}
      appearance={{
        button:
          "bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2",
        allowedContent: "text-gray-500 text-sm",
      }}
    />
  );
}

// Dropzone variant
import { UploadDropzone } from "@uploadthing/react";

export function DocumentUploader({
  onUploadComplete,
}: {
  onUploadComplete: (files: { url: string; name: string }[]) => void;
}) {
  return (
    <UploadDropzone<OurFileRouter, "documents">
      endpoint="documents"
      onClientUploadComplete={(res) => {
        onUploadComplete(res.map((r) => ({ url: r.url, name: r.name })));
      }}
      onUploadError={(error) => {
        toast.error(error.message);
      }}
      config={{ mode: "auto" }}
      appearance={{
        container:
          "border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 transition-colors",
        uploadIcon: "text-gray-400",
        label: "text-gray-600",
        allowedContent: "text-gray-400 text-sm",
      }}
      content={{
        label: "Drop files here or click to upload",
        allowedContent: "PDF, DOC up to 16MB each",
      }}
    />
  );
}
```

**Gotchas:**
- UploadThing requires server-side route setup
- File URLs are permanent unless explicitly deleted
- Large file uploads need increased timeout
- Use webhook for reliable post-processing

### 2. S3/R2 Direct Uploads

Implement direct uploads to S3 or Cloudflare R2 for maximum control.

**Best Practices:**
- Use presigned URLs for direct uploads
- Set appropriate CORS configuration
- Implement multipart upload for large files
- Clean up incomplete uploads
- Use CDN for serving files

**Common Patterns:**

```typescript
// lib/s3.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// For Cloudflare R2
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Generate presigned upload URL
export async function getUploadUrl(
  filename: string,
  contentType: string,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
) {
  const key = `uploads/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    key,
    publicUrl: `${process.env.CDN_URL}/${key}`,
  };
}

// API Route
// app/api/upload/presigned/route.ts
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType, size } = await req.json();

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // Validate size
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (size > maxSize) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const { uploadUrl, key, publicUrl } = await getUploadUrl(filename, contentType);

  return NextResponse.json({ uploadUrl, key, publicUrl });
}

// Client-side upload
async function uploadToS3(file: File) {
  // Get presigned URL
  const response = await fetch("/api/upload/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  const { uploadUrl, publicUrl, error } = await response.json();
  if (error) throw new Error(error);

  // Upload directly to S3
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  return publicUrl;
}
```

```tsx
// components/s3-uploader.tsx
"use client";

export function S3Uploader({
  onUploadComplete,
  onUploadError,
  accept,
}: {
  onUploadComplete: (url: string) => void;
  onUploadError: (error: Error) => void;
  accept?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      // Get presigned URL
      const response = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      const { uploadUrl, publicUrl, error } = await response.json();
      if (error) throw new Error(error);

      // Upload with progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      onUploadComplete(publicUrl);
    } catch (error) {
      onUploadError(error as Error);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={handleFileChange}
        accept={accept}
        disabled={isUploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Gotchas:**
- CORS must be configured on S3/R2 bucket
- Presigned URLs expire - handle errors gracefully
- Large files need multipart upload
- Clean up failed uploads with lifecycle rules

### 3. Image Optimization

Process and optimize images during upload.

**Best Practices:**
- Resize images to appropriate dimensions
- Generate multiple sizes for responsive images
- Convert to modern formats (WebP, AVIF)
- Strip EXIF data for privacy
- Implement lazy loading

**Common Patterns:**

```typescript
// lib/image-processing.ts
import sharp from "sharp";

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

export async function processImage(
  input: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "webp" | "jpeg" | "png" | "avif";
  } = {}
): Promise<ProcessedImage> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 80, format = "webp" } = options;

  const pipeline = sharp(input)
    .rotate() // Auto-rotate based on EXIF
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

  let result: sharp.Sharp;
  switch (format) {
    case "webp":
      result = pipeline.webp({ quality });
      break;
    case "avif":
      result = pipeline.avif({ quality });
      break;
    case "jpeg":
      result = pipeline.jpeg({ quality, progressive: true });
      break;
    default:
      result = pipeline.png({ quality });
  }

  const buffer = await result.toBuffer();
  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    width: metadata.width!,
    height: metadata.height!,
    format,
  };
}

// Generate responsive image sizes
export async function generateResponsiveImages(
  input: Buffer
): Promise<Map<string, Buffer>> {
  const sizes = [
    { name: "thumbnail", width: 150, height: 150 },
    { name: "small", width: 400, height: 300 },
    { name: "medium", width: 800, height: 600 },
    { name: "large", width: 1200, height: 900 },
  ];

  const results = new Map<string, Buffer>();

  for (const size of sizes) {
    const processed = await sharp(input)
      .resize(size.width, size.height, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toBuffer();

    results.set(size.name, processed);
  }

  return results;
}

// API Route for image upload with processing
// app/api/upload/image/route.ts
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Process and generate sizes
  const sizes = await generateResponsiveImages(buffer);

  // Upload all sizes to S3
  const urls: Record<string, string> = {};
  for (const [sizeName, sizeBuffer] of sizes) {
    const key = `images/${Date.now()}-${sizeName}.webp`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: sizeBuffer,
        ContentType: "image/webp",
      })
    );
    urls[sizeName] = `${process.env.CDN_URL}/${key}`;
  }

  return NextResponse.json({ urls });
}
```

**Gotchas:**
- Sharp requires native bindings - may need platform-specific setup
- Process images in background jobs for large uploads
- Memory limits can be hit with many concurrent uploads
- Consider using Cloudflare Images or similar services

### 4. Drag and Drop Interfaces

Build intuitive drag-and-drop upload experiences.

**Best Practices:**
- Show clear drop zones with visual feedback
- Support both drag-and-drop and click-to-upload
- Preview files before upload
- Handle multiple files
- Show upload progress for each file

**Common Patterns:**

```tsx
// components/dropzone.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File, Image, Check } from "lucide-react";

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: "pending" | "uploading" | "complete" | "error";
  uploadedUrl?: string;
}

interface DropzoneProps {
  onUploadComplete: (files: { name: string; url: string }[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
}

export function Dropzone({
  onUploadComplete,
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
  maxSize = 5 * 1024 * 1024,
  maxFiles = 5,
}: DropzoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Add files with preview
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          uploadProgress: 0,
          uploadStatus: "pending" as const,
        })
      );

      setFiles((prev) => [...prev, ...newFiles]);

      // Upload each file
      const uploadedFiles: { name: string; url: string }[] = [];

      for (const file of newFiles) {
        try {
          // Update status to uploading
          setFiles((prev) =>
            prev.map((f) =>
              f === file ? { ...f, uploadStatus: "uploading" as const } : f
            )
          );

          // Get presigned URL and upload
          const response = await fetch("/api/upload/presigned", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              size: file.size,
            }),
          });

          const { uploadUrl, publicUrl } = await response.json();

          // Upload with XMLHttpRequest for progress
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setFiles((prev) =>
                  prev.map((f) =>
                    f === file ? { ...f, uploadProgress: progress } : f
                  )
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(null);
              } else {
                reject(new Error("Upload failed"));
              }
            };

            xhr.onerror = () => reject(new Error("Upload failed"));

            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);
          });

          // Update status to complete
          setFiles((prev) =>
            prev.map((f) =>
              f === file
                ? { ...f, uploadStatus: "complete" as const, uploadedUrl: publicUrl }
                : f
            )
          );

          uploadedFiles.push({ name: file.name, url: publicUrl });
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f === file ? { ...f, uploadStatus: "error" as const } : f
            )
          );
        }
      }

      if (uploadedFiles.length > 0) {
        onUploadComplete(uploadedFiles);
      }
    },
    [onUploadComplete]
  );

  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles((prev) => prev.filter((f) => f !== fileToRemove));
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragActive && "border-blue-500 bg-blue-50",
          isDragReject && "border-red-500 bg-red-50",
          !isDragActive && !isDragReject && "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-600">Drag & drop files here, or click to select</p>
            <p className="text-sm text-gray-400 mt-2">
              Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              {/* Preview */}
              {file.preview && file.type.startsWith("image/") ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <File className="w-12 h-12 text-gray-400" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>

                {/* Progress bar */}
                {file.uploadStatus === "uploading" && (
                  <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${file.uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status/Actions */}
              {file.uploadStatus === "complete" && (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {file.uploadStatus === "error" && (
                <span className="text-xs text-red-500">Failed</span>
              )}
              <button
                onClick={() => removeFile(file)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Gotchas:**
- Clean up object URLs to prevent memory leaks
- Handle browser compatibility for drag-and-drop
- Mobile devices may not support drag-and-drop
- Large file lists can impact performance

### 5. File Validation and Security

Implement robust file validation to prevent security issues.

**Best Practices:**
- Validate file types on both client and server
- Check file signatures (magic bytes) not just extensions
- Sanitize filenames
- Set size limits appropriately
- Store files outside web root

**Common Patterns:**

```typescript
// lib/file-validation.ts

// File type signatures (magic bytes)
const FILE_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
};

export async function validateFileType(
  file: File | Buffer,
  allowedTypes: string[]
): Promise<{ valid: boolean; detectedType: string | null }> {
  const buffer =
    file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());
  const header = buffer.slice(0, 12);

  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const signature of signatures) {
      if (signature.every((byte, index) => header[index] === byte)) {
        return {
          valid: allowedTypes.includes(mimeType),
          detectedType: mimeType,
        };
      }
    }
  }

  return { valid: false, detectedType: null };
}

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^[._-]+/, "")
    .slice(0, 255);
}

// Generate safe storage key
export function generateStorageKey(
  userId: string,
  filename: string,
  prefix: string = "uploads"
): string {
  const sanitized = sanitizeFilename(filename);
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  const timestamp = Date.now();
  const random = nanoid(8);

  return `${prefix}/${userId}/${timestamp}-${random}-${name}${ext}`;
}

// Comprehensive file validation
export async function validateUpload(
  file: File,
  options: {
    allowedTypes: string[];
    maxSize: number;
    minSize?: number;
  }
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Size validation
  if (file.size > options.maxSize) {
    errors.push(
      `File size exceeds maximum (${(options.maxSize / 1024 / 1024).toFixed(2)}MB)`
    );
  }

  if (options.minSize && file.size < options.minSize) {
    errors.push("File size is below minimum required");
  }

  // Magic bytes validation
  const typeValidation = await validateFileType(file, options.allowedTypes);
  if (!typeValidation.valid) {
    errors.push("Invalid file type detected");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Server-side validation in API route
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validation = await validateUpload(file, {
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors.join(", ") },
      { status: 400 }
    );
  }

  // Proceed with upload...
}
```

**Gotchas:**
- Never trust client-provided MIME types alone
- Extension validation is insufficient for security
- Consider antivirus scanning for user uploads
- Log validation failures for monitoring

## Related Skills

- `nextjs-app-router-mastery` - Server Actions for uploads
- `react-expert` - React patterns for upload UIs
- `supabase-expert` - Supabase Storage integration
- `image-optimization` - Advanced image processing

## Further Reading

- [UploadThing Documentation](https://uploadthing.com/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master file handling for modern web applications*
