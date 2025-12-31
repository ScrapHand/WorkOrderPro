# Work Order Pro

A modern, intelligent CMMS for Asset Management and Work Order Prioritization.

## Features
- **Asset Hierarchy**: Infinite depth tree structure for equipment modeling.
- **RIME Engine**: Automated work order scoring based on asset criticality and priority.
- **Recursive Logic**: Smart inheritance of properties across the asset tree.
- **Cloud Native**: S3 interactions using Presigned URLs for secure, fast uploads.
- **Multi-Tenant**: Built for SaaS from day one.

## Setup

### Prerequisites
- Node.js v18+
- PostgreSQL
- AWS S3 Bucket (Optional for uploads)

### Installation
1.  Clone repository.
2.  Install dependencies:
    ```bash
    cd apps/backend-node
    npm install
    cd ../../apps/web
    npm install
    ```

### Configuration (.env)
Create `.env` in `apps/backend-node`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/wop"
PORT=8080
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="wop-assets"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

### Running Locally
1.  **Backend**:
    ```bash
    cd apps/backend-node
    npx prisma generate
    npx prisma db push
    npm run dev
    ```
2.  **Frontend**:
    ```bash
    cd apps/web
    npm run dev
    ```
3.  Access UI at `http://localhost:3000`.

## Architecture
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details on the Recursive CTEs and RIME logic.
