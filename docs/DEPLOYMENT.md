# Production Deployment Guide

## 1. Backend (Render)

### Environment Variables
Ensure the following variables are set in the Render Dashboard -> Environment:

- `NODE_ENV`: `production`
- `DATABASE_URL`: (Internal Connection String)
- `SESSION_SECRET`: **REQUIRED** (You provided `JWT_SECRET`, but `express-session` needs `SESSION_SECRET`. Generate a new random string.)
- `AWS_ACCESS_KEY_ID`: `AKIASDAG6UNOZNQNKK2G`
- `AWS_SECRET_ACCESS_KEY`: `...`
- `AWS_REGION`: `eu-north-1`
- `AWS_BUCKET_NAME`: `workorderpro-assets-823941`

### Pre-Deploy Command
The `render.yaml` is configured to run `npx prisma migrate deploy` before promoting the build.

## 2. Frontend (Vercel)

### Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `next build` (or `npm run build`)
- **Output Directory**: `.next`

### Environment Variables
- `NEXT_PUBLIC_API_URL`: `https://workorderpro-api.onrender.com` (No trailing slash)

## 3. S3 CORS Configuration

Go to AWS S3 Console -> Bucket -> Permissions -> CORS and paste:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://workorderpro.vercel.app",
            "https://*.vercel.app"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```
