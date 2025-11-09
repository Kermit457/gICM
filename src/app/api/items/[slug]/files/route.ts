import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getItemBySlug } from '@/lib/registry';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const item = getItemBySlug(slug);

  if (!item) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    );
  }

  try {
    const files: { path: string; content: string }[] = [];

    for (const filePath of (item.files || [])) {
      try {
        const fullPath = join(process.cwd(), filePath);
        const content = readFileSync(fullPath, 'utf-8');

        // Extract relative path after .claude/
        const relativePath = filePath.split('.claude/')[1] || filePath;

        files.push({
          path: relativePath,
          content
        });
      } catch (error) {
        console.warn(`Could not read file: ${filePath}`, error);
        // Continue with other files
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files found for this item' },
        { status: 404 }
      );
    }

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error reading files:', error);
    return NextResponse.json(
      { error: 'Failed to read files' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
