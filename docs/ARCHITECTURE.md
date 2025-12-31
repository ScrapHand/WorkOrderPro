# Work Order Pro - System Architecture

## 1. Overview
Work Order Pro is a multi-tenant CMMS (Computerized Maintenance Management System) designed for high-performance asset management and automated prioritization. It uses a "Hybrid Monolith" architecture with a Python Legacy API (Phase 1) and a modern Node.js/Express Core (Phase 2+).

## 2. Technology Stack
- **Frontend**: Next.js 14, TailwindCSS, React Query, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: PostgreSQL (Prisma ORM).
- **Storage**: AWS S3 (Presigned URLs).

## 3. Key Architectural Patterns

### 3.1. Recursive "Brain" (Asset Hierarchy)
Assets are modeled as a self-referencing adjacency list (`parentId`).
- **Read**: Optimized using **Recursive Common Table Expressions (CTEs)** in PostgreSQL.
    - `findSubtree(rootId)`: Efficiently fetches entire subtrees in a single query.
    - `findAncestors(assetId)`: Walks up the tree to find root or inherit properties.
- **Write**: Standard adjacency list inserts.

### 3.2. RIME (Ranking Index for Maintenance Expenditures)
Work Order priority is automated, not guessed.
$$ \text{RIME Score} = \text{Asset Criticality} \times \text{Work Order Priority} $$

**Recursive Criticality Inheritance**:
If an asset (e.g., "Pump A") lacks a criticality score, the system traverses up the ancestry (via `findAncestors`) to inherit the criticality of the nearest parent (e.g., "Production Line B").

- **Asset Criticality**: 1 (Low) to 10 (Critical).
- **Work Order Priority**: 10 (Critical), 7 (High), 4 (Medium), 1 (Low).

### 3.3. Multi-Tenant Isolation
- **Database**: Row-Level Security (simulated) via `tenant_id` column on all major entities (`Asset`, `WorkOrder`, `Attachment`).
- **Middleware**: `tenant.middleware.ts` extracts `X-Tenant-Slug`, resolves context, and isolates requests via `AsyncLocalStorage`.
- **Object Storage**: S3 Keys are strictlyNamespaced: `tenants/{tenantUUID}/...`.

## 4. Database Schema
### Asset
- `id` (UUID)
- `parentId` (Self-ref)
- `hierarchyPath` (Materialized Path for quick filtering)
- `criticality` (Nullable, inheritable)

### WorkOrder
- `priority`: Enum (Mapped to numeric)
- `rimeScore`: Int (Calculated on create)

### Attachment
- `key`: S3 Key
- `url`: Public/Presigned URL

## 5. Security
- **Authentication**: Phase 1 Mock (Authorization Header / Cookie).
- **Uploads**: Direct-to-S3 via Presigned URLs. Backend validates permissions before signing. Server does not handle file streams.

## 6. Deployment
- **Frontend**: Vercel (Recommended).
- **Backend**: Render / Railway (Dockerized).
- **DB**: Neon / Supabase (Postgres).
