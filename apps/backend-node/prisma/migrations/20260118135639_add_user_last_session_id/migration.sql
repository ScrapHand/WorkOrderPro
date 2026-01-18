/*
  Warnings:

  - You are about to drop the column `created_at` on the `ConveyorSystem` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `ConveyorSystem` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `FactoryLayout` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `FactoryLayout` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ConveyorSystem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FactoryLayout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "serial_number" TEXT;

-- AlterTable
ALTER TABLE "ConveyorSystem" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "FactoryLayout" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PMSchedule" ADD COLUMN     "assigned_to_user_id" TEXT,
ADD COLUMN     "frequency_interval" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "frequency_type" TEXT NOT NULL DEFAULT 'days',
ADD COLUMN     "last_performed_at" TIMESTAMP(3),
ALTER COLUMN "frequency" DROP NOT NULL,
ALTER COLUMN "start_date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "category" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pcs';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "features" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_verified" TIMESTAMP(3),
ADD COLUMN     "last_session_id" TEXT,
ADD COLUMN     "verification_code" TEXT;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "loto_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loto_verified_at" TIMESTAMP(3),
ADD COLUMN     "sla_deadline" TIMESTAMP(3),
ADD COLUMN     "sla_status" TEXT NOT NULL DEFAULT 'IN_TARGET';

-- CreateTable
CREATE TABLE "PMLog" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pm_schedule_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_by_user_id" TEXT,
    "notes" TEXT,

    CONSTRAINT "PMLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "layout_json" JSONB NOT NULL,
    "is_system_default" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftHandover" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "outgoing_user_id" TEXT NOT NULL,
    "incoming_user_id" TEXT,
    "shift_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "content" JSONB NOT NULL,
    "signed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftHandover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAlert" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "InventoryAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderComment" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformLog" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_id" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PMLog_tenant_id_idx" ON "PMLog"("tenant_id");

-- CreateIndex
CREATE INDEX "PMLog_pm_schedule_id_idx" ON "PMLog"("pm_schedule_id");

-- CreateIndex
CREATE INDEX "Page_tenant_id_idx" ON "Page"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "Page_tenant_id_key_key" ON "Page"("tenant_id", "key");

-- CreateIndex
CREATE INDEX "ShiftHandover_tenant_id_idx" ON "ShiftHandover"("tenant_id");

-- CreateIndex
CREATE INDEX "ShiftHandover_status_idx" ON "ShiftHandover"("status");

-- CreateIndex
CREATE INDEX "InventoryAlert_tenant_id_idx" ON "InventoryAlert"("tenant_id");

-- CreateIndex
CREATE INDEX "InventoryAlert_status_idx" ON "InventoryAlert"("status");

-- CreateIndex
CREATE INDEX "WorkOrderComment_work_order_id_idx" ON "WorkOrderComment"("work_order_id");

-- CreateIndex
CREATE INDEX "PlatformLog_admin_id_idx" ON "PlatformLog"("admin_id");

-- CreateIndex
CREATE INDEX "PlatformLog_action_idx" ON "PlatformLog"("action");

-- AddForeignKey
ALTER TABLE "PMSchedule" ADD CONSTRAINT "PMSchedule_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMLog" ADD CONSTRAINT "PMLog_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMLog" ADD CONSTRAINT "PMLog_pm_schedule_id_fkey" FOREIGN KEY ("pm_schedule_id") REFERENCES "PMSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMLog" ADD CONSTRAINT "PMLog_completed_by_user_id_fkey" FOREIGN KEY ("completed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftHandover" ADD CONSTRAINT "ShiftHandover_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftHandover" ADD CONSTRAINT "ShiftHandover_outgoing_user_id_fkey" FOREIGN KEY ("outgoing_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftHandover" ADD CONSTRAINT "ShiftHandover_incoming_user_id_fkey" FOREIGN KEY ("incoming_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAlert" ADD CONSTRAINT "InventoryAlert_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAlert" ADD CONSTRAINT "InventoryAlert_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderComment" ADD CONSTRAINT "WorkOrderComment_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderComment" ADD CONSTRAINT "WorkOrderComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
