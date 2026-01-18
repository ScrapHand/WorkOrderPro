# Skill: File Handling & S3 Integration

## Context
Files (photos, documents) are stored in S3. To maximize performance and security, we use Direct S3 Uploads (via Presigned URLs) and an S3 Proxy for secure cross-origin retrieval.

## The Three-Step Upload Protocol
1. **Get Presigned URL**:
   - Frontend calls `POST /upload/presign` with `entityType`, `entityId`, and `fileName`.
   - Backend returns a `url` (PUT) and a `key`.
2. **Direct PUT to S3**:
   - Frontend performs a `PUT` request directly to the S3 URL with the file blob.
   - Use native `fetch` to avoid Axios header overhead.
3. **Confirm Upload**:
   - Frontend calls `POST /upload/confirm` with the file metadata and S3 key.
   - Backend creates an `Attachment` record in the database.

## S3 Proxy & Retrieval
- **URL Format**: Proxied URLs look like `/api/v1/upload/proxy?key=...`.
- **Security**: The proxy enforces tenant scoping by checking the file path against the current tenant context.
- **MIME Types**: The proxy correctly sets `Content-Type` based on the file's extension or stored metadata.

## Backend Implementation
- **S3Service**: Use the `s3.service.ts` for all interactions with the bucket.
- **Stream Response**: The proxy should stream content from S3 directly to the response to minimize memory usage.

## Common Pitfalls
- **Signature Mismatch**: Ensure the `Content-Type` header during PUT matches the one used to generate the signature.
- **Orphaned Files**: Ensure that deleting a record also cleans up its S3 attachments (or marks them for cleanup).
