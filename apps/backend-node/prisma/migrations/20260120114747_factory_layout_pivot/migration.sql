/*
  Warnings:

  - You are about to drop the column `description` on the `FactoryLayout` table. All the data in the column will be lost.
  - You are about to drop the column `is_locked` on the `FactoryLayout` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `FactoryLayout` table. All the data in the column will be lost.
  - You are about to drop the column `viewport_json` on the `FactoryLayout` table. All the data in the column will be lost.
  - You are about to drop the `ConveyorSystem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FactoryLayoutEdge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FactoryLayoutNode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConveyorSystem" DROP CONSTRAINT "ConveyorSystem_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "FactoryLayoutEdge" DROP CONSTRAINT "FactoryLayoutEdge_conveyor_system_id_fkey";

-- DropForeignKey
ALTER TABLE "FactoryLayoutEdge" DROP CONSTRAINT "FactoryLayoutEdge_layout_id_fkey";

-- DropForeignKey
ALTER TABLE "FactoryLayoutEdge" DROP CONSTRAINT "FactoryLayoutEdge_source_node_id_fkey";

-- DropForeignKey
ALTER TABLE "FactoryLayoutEdge" DROP CONSTRAINT "FactoryLayoutEdge_target_node_id_fkey";

-- DropForeignKey
ALTER TABLE "FactoryLayoutNode" DROP CONSTRAINT "FactoryLayoutNode_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "FactoryLayoutNode" DROP CONSTRAINT "FactoryLayoutNode_layout_id_fkey";

-- AlterTable
ALTER TABLE "FactoryLayout" DROP COLUMN "description",
DROP COLUMN "is_locked",
DROP COLUMN "version",
DROP COLUMN "viewport_json";

-- DropTable
DROP TABLE "ConveyorSystem";

-- DropTable
DROP TABLE "FactoryLayoutEdge";

-- DropTable
DROP TABLE "FactoryLayoutNode";

-- DropEnum
DROP TYPE "EdgeType";

-- CreateTable
CREATE TABLE "FactoryNode" (
    "id" TEXT NOT NULL,
    "layout_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "visuals" JSONB NOT NULL,

    CONSTRAINT "FactoryNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoryEdge" (
    "id" TEXT NOT NULL,
    "layout_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "FactoryEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FactoryNode_layout_id_idx" ON "FactoryNode"("layout_id");

-- CreateIndex
CREATE INDEX "FactoryNode_tenant_id_idx" ON "FactoryNode"("tenant_id");

-- CreateIndex
CREATE INDEX "FactoryEdge_layout_id_idx" ON "FactoryEdge"("layout_id");

-- CreateIndex
CREATE INDEX "FactoryEdge_tenant_id_idx" ON "FactoryEdge"("tenant_id");

-- AddForeignKey
ALTER TABLE "FactoryNode" ADD CONSTRAINT "FactoryNode_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "FactoryLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryNode" ADD CONSTRAINT "FactoryNode_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryEdge" ADD CONSTRAINT "FactoryEdge_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "FactoryLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
