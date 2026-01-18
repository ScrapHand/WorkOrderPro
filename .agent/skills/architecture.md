# WorkOrderPro - Architectural Skill Index

Welcome to the Self-Evolution knowledge base for the WorkOrderPro project. This directory contains specialized skills to ensure consistency and correctness in all future implementations.

## 🏛️ Core Architectural Pillars
- **[Multi-Tenancy](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/multi-tenancy.md)**: Rules for data isolation and dynamic routing.
- **[Security & RBAC](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/security-rbac.md)**: Middleware usage, roles, and permission guarding.

## ⚙️ Feature-Specific Skills
- **[Asset Management](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/asset-management.md)**: Hierarchies, CTE usage, and status synchronization.
- **[Maintenance Logic](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/maintenance-logic.md)**: RIME scoring formulas and PM schedule management.
- **[S3 File Handling](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/s3-file-handling.md)**: Presigned URL protocol and S3 proxy retrieval.

## 🚀 Advanced Industrial Skills (Professional Tier)
- **[Safety Protocols & LOTO](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/safety-protocols.md)**: Digital sign-offs, isolation verification, and safety-critical workflows.
- **[Factory Monitoring](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/factory-monitoring.md)**: Real-time state projection on graphs and visual monitoring.
- **[Performance Metrics](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/performance-metrics.md)**: MTBF, MTTR, and the three pillars of OEE calculation.
- **[Inventory Optimization](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/inventory-optimization.md)**: Stock threshold management and automated availability alerts.
- **[Operational Handover](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/operational-handover.md)**: Standardized procedures for shift transitions and digital sign-offs.

## 🛡️ Platform Orchestration
- **[Super Admin & Orchestration](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/platform-orchestration.md)**: Global oversight, modular feature provisioning, and cross-tenant management.

## 🎨 Frontend & UI
- **[Design System Standards](file:///C:/Users/ScrapHand/Desktop/WorkOrderPro/.agent/skills/design-system.md)**: Theming, Tailwind usage, and data-fetching patterns.

---

## ⚡ Global Safeguards (Anti-Pitfalls)
> [!WARNING]
> Always filter payloads for `undefined` or `null` before spreading them into Prisma `update` operations to prevent data loss.

> [!IMPORTANT]
> Always use `finally` blocks to clear UI loading states (spinners) in complex async operations.

> [!TIP]
> Use the `getTenantSlug` utility to ensure all frontend links include the correct multi-tenancy context.
