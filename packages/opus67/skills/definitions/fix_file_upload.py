#!/usr/bin/env python3
"""Add validation section to file-upload-expert.md."""

import os

skill_path = "C:/Users/mirko/OneDrive/Desktop/gICM/packages/opus67/skills/definitions/file-upload-expert.md"

additional_content = r'''

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

'''

# Read current content
with open(skill_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find insertion point
insert_marker = "## Related Skills"
insert_idx = content.find(insert_marker)

if insert_idx != -1:
    # Insert before Related Skills
    new_content = content[:insert_idx] + additional_content.strip() + "\n\n" + content[insert_idx:]
else:
    # Fallback: append before footer
    footer_marker = "---\n\n*This skill"
    footer_idx = content.find(footer_marker)
    if footer_idx != -1:
        new_content = content[:footer_idx] + additional_content.strip() + "\n\n" + content[footer_idx:]
    else:
        new_content = content.rstrip() + "\n" + additional_content

# Write updated content
with open(skill_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

line_count = len(new_content.split('\n'))
print(f"file-upload-expert.md: {line_count} lines")
