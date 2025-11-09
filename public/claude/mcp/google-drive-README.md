# Google Drive MCP

Cloud file storage and collaboration platform integration.

## Overview

The Google Drive MCP provides complete access to Google Drive for file storage, sharing, and collaboration. Upload files, manage folders, share documents, and integrate cloud storage into your development workflow.

## Installation

```bash
npm install -g @google/drive-mcp-server
```

## Environment Variables

```bash
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
GOOGLE_DRIVE_FOLDER_ID=optional_default_folder  # Optional: default upload folder
```

Setup OAuth 2.0 credentials at: https://console.cloud.google.com/apis/credentials

## Features

- **File Upload/Download**: Store and retrieve files
- **Folder Management**: Create, organize, move folders
- **File Sharing**: Share files with permissions control
- **Search**: Find files by name, type, content
- **Metadata**: Read and update file metadata
- **Versioning**: Access file version history
- **Google Workspace**: Create Docs, Sheets, Slides
- **Real-time Collaboration**: Monitor file changes

## Usage Examples

### Upload Files

```typescript
import { googleDrive } from '@google/mcp';

// Upload deployment artifacts
const file = await googleDrive.uploadFile({
  name: 'program-v1.2.0.so',
  content: programBuffer,
  mimeType: 'application/octet-stream',
  folderId: 'deployments-folder-id'
});

console.log('Uploaded:', file.webViewLink);
```

### Create Shared Documentation

```typescript
// Create deployment checklist
const doc = await googleDrive.createDocument({
  name: 'Deployment Checklist - v1.2.0',
  content: checklistMarkdown,
  folderId: 'docs-folder-id'
});

// Share with team
await googleDrive.shareFile({
  fileId: doc.id,
  role: 'writer',  // reader, commenter, writer
  type: 'user',
  emailAddress: 'team@example.com'
});
```

### Search Files

```typescript
// Find all deployment logs from last week
const logs = await googleDrive.searchFiles({
  query: "name contains 'deployment-log' and modifiedTime > '2025-01-01'",
  orderBy: 'modifiedTime desc',
  fields: 'files(id, name, createdTime, webViewLink)'
});

logs.files.forEach(file => {
  console.log(`${file.name}: ${file.webViewLink}`);
});
```

### Download Files

```typescript
// Download config file
const config = await googleDrive.downloadFile({
  fileId: 'config-file-id',
  format: 'text'  // or 'binary', 'json'
});

const settings = JSON.parse(config);
```

### Folder Operations

```typescript
// Create organized folder structure
const projectFolder = await googleDrive.createFolder({
  name: 'Token Launch Platform',
  parentId: 'root'
});

await googleDrive.createFolder({
  name: 'Deployments',
  parentId: projectFolder.id
});

await googleDrive.createFolder({
  name: 'Documentation',
  parentId: projectFolder.id
});
```

## Tools Provided

- `drive_upload_file` - Upload file to Drive
- `drive_download_file` - Download file from Drive
- `drive_create_folder` - Create new folder
- `drive_list_files` - List files in folder
- `drive_search_files` - Search files
- `drive_share_file` - Share file with permissions
- `drive_delete_file` - Delete file
- `drive_update_metadata` - Update file metadata
- `drive_create_document` - Create Google Doc

## Integration Patterns

**Automated Deployment Logs:**
```typescript
export async function logDeployment(version: string, logs: string) {
  const file = await googleDrive.uploadFile({
    name: `deployment-${version}-${Date.now()}.log`,
    content: logs,
    mimeType: 'text/plain',
    folderId: process.env.DEPLOYMENTS_FOLDER_ID
  });

  // Share with team
  await googleDrive.shareFile({
    fileId: file.id,
    role: 'reader',
    type: 'domain',
    domain: 'company.com'
  });

  return file.webViewLink;
}
```

**Backup Smart Contract Code:**
```typescript
async function backupContracts(programId: string, code: Buffer) {
  await googleDrive.uploadFile({
    name: `${programId}-${new Date().toISOString()}.so`,
    content: code,
    folderId: 'smart-contracts-backup',
    description: `Backup of program ${programId}`
  });
}
```

## Web3 Use Cases

- **Deployment artifacts**: Store compiled programs/contracts
- **Audit reports**: Share security audit documents
- **Team collaboration**: Shared docs for project planning
- **Backup storage**: Contract code backups
- **Documentation**: Technical docs, API references
- **Configuration**: Shared environment configs
- **Media assets**: NFT images, brand assets
- **Analytics reports**: Export performance data

## Security Best Practices

1. **Use service accounts**: For automated workflows
2. **Limit permissions**: Grant minimum required access
3. **Encrypt sensitive data**: Before uploading secrets
4. **Audit access**: Regular review of file shares
5. **Version control**: Enable versioning for critical files
6. **Backup strategy**: Don't rely solely on Drive

## File Limits

- **File size**: 5TB per file (unlimited storage with Workspace)
- **Upload**: Up to 750GB per day per user
- **API calls**: 20,000 requests per 100 seconds per user
- **Sharing**: Up to 600 shares per file

## Cost

- **Personal**: 15GB free, $1.99/mo for 100GB
- **Workspace**: Starting at $6/user/month (Business Standard)
- **API usage**: Free (subject to quotas)

## Repository

https://github.com/googleapis/google-drive-mcp

---

**Version:** 1.0.0
**Category:** Cloud Storage
**Last Updated:** 2025-01-08
