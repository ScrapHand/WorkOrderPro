# Deployment Guide: WorkOrderPro

This guide details the specific configuration required to deploy WorkOrderPro to Production (Render + Vercel + AWS S3).

## 1. Backend (Render) - Manual Handoff

The repository now includes value `render.yaml` blueprint.

1.  **Connect GitHub**: Go to Render Dashboard -> "New" -> "Blueprint".
2.  **Select Repository**: Choose `WorkOrderPro`.
3.  **Approve**: Render will detect `render.yaml` and autoconfigure the Node.js service and Postgres database.
4.  **Verify**: Ensure the service starts and enters "Live" status.

### Manual Environment Variables
If you are NOT using the Blueprint, ensure these are set:
| Variable | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` (CRITICAL for secure cookies) |
### Database Initialization (Critical)
Since we are initializing a fresh schema without previous migration history files, use `db push` instead of `migrate deploy`.

In the Render **Shell** (or as a Build Command if one-off):
```bash
npx prisma db push --accept-data-loss
```
*This command forces the database schema to match your `schema.prisma` file.*

---

## 2. Frontend (Vercel) - Manual Handoff

1.  **Import Project**: Go to Vercel Dashboard -> "add New..." -> "Project".
2.  **Select Repository**: Choose `WorkOrderPro`.
3.  **Configure Project**:
    *   **Root Directory**: Edit and select `apps/web`.
    *   **Framework Preset**: Next.js.
4.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: Set this to your Render Service URL (e.g., `https://workorderpro-backend.onrender.com/api`).
5.  **Deploy**: Click "Deploy".

---

## 3. AWS S3 Configuration (CORS)

To allow the Browser (Vercel) to upload directly to S3 (Presigned URLs), you must update the Bucket CORS policy.

**Copy-Paste this JSON into your S3 Bucket -> Permissions -> CORS:**

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "GET"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://*.vercel.app"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```
*Note: The wildcard `https://*.vercel.app` allows preview deployments. For production, restrict to your specific domain.*

---

## 4. Final Verification
1.  **Login**: Access Vercel URL -> Login. (Checks `TRUST_PROXY` / CHIPS cookies).
2.  **Asset Tree**: Dashboard -> Assets. (Checks DB Connection).
3.  **Work Order + Upload**: Create Work Order -> Upload File. (Checks S3 CORS + Presigned URL).
