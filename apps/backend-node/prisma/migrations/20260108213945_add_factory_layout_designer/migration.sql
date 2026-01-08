-- CreateEnum
CREATE TYPE "EdgeType" AS ENUM ('CONVEYOR', 'MODULE');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "design_oee" DOUBLE PRECISION,
ADD COLUMN     "max_speed" DOUBLE PRECISION,
ADD COLUMN     "production_line_id" TEXT;

-- CreateTable
CREATE TABLE "ProductionLine" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetConnection" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "production_line_id" TEXT NOT NULL,
    "source_asset_id" TEXT NOT NULL,
    "target_asset_id" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL DEFAULT 'CONVEYOR',
    "speed_limit" DOUBLE PRECISION,
    "throughput" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoryLayout" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "viewport_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoryLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoryLayoutNode" (
    "id" TEXT NOT NULL,
    "layout_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "rotation" INTEGER DEFAULT 0,
    "meta_json" JSONB,

    CONSTRAINT "FactoryLayoutNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoryLayoutEdge" (
    "id" TEXT NOT NULL,
    "layout_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,
    "type" "EdgeType" NOT NULL DEFAULT 'CONVEYOR',
    "conveyor_system_id" TEXT,
    "label" TEXT,
    "meta_json" JSONB,

    CONSTRAINT "FactoryLayoutEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConveyorSystem" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#808080',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConveyorSystem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionLine_tenant_id_idx" ON "ProductionLine"("tenant_id");

-- CreateIndex
CREATE INDEX "AssetConnection_tenant_id_idx" ON "AssetConnection"("tenant_id");

-- CreateIndex
CREATE INDEX "AssetConnection_production_line_id_idx" ON "AssetConnection"("production_line_id");

-- CreateIndex
CREATE INDEX "FactoryLayout_tenant_id_idx" ON "FactoryLayout"("tenant_id");

-- CreateIndex
CREATE INDEX "FactoryLayoutNode_layout_id_idx" ON "FactoryLayoutNode"("layout_id");

-- CreateIndex
CREATE INDEX "FactoryLayoutNode_tenant_id_idx" ON "FactoryLayoutNode"("tenant_id");

-- CreateIndex
CREATE INDEX "FactoryLayoutNode_asset_id_idx" ON "FactoryLayoutNode"("asset_id");

-- CreateIndex
CREATE INDEX "FactoryLayoutEdge_layout_id_idx" ON "FactoryLayoutEdge"("layout_id");

-- CreateIndex
CREATE INDEX "FactoryLayoutEdge_tenant_id_idx" ON "FactoryLayoutEdge"("tenant_id");

-- CreateIndex
CREATE INDEX "FactoryLayoutEdge_source_node_id_idx" ON "FactoryLayoutEdge"("source_node_id");

-- CreateIndex
CREATE INDEX "FactoryLayoutEdge_target_node_id_idx" ON "FactoryLayoutEdge"("target_node_id");

-- CreateIndex
CREATE INDEX "ConveyorSystem_tenant_id_idx" ON "ConveyorSystem"("tenant_id");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_production_line_id_fkey" FOREIGN KEY ("production_line_id") REFERENCES "ProductionLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLine" ADD CONSTRAINT "ProductionLine_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetConnection" ADD CONSTRAINT "AssetConnection_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetConnection" ADD CONSTRAINT "AssetConnection_production_line_id_fkey" FOREIGN KEY ("production_line_id") REFERENCES "ProductionLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetConnection" ADD CONSTRAINT "AssetConnection_source_asset_id_fkey" FOREIGN KEY ("source_asset_id") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetConnection" ADD CONSTRAINT "AssetConnection_target_asset_id_fkey" FOREIGN KEY ("target_asset_id") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryLayout" ADD CONSTRAINT "FactoryLayout_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryLayoutNode" ADD CONSTRAINT "FactoryLayoutNode_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "FactoryLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryLayoutNode" ADD CONSTRAINT "FactoryLayoutNode_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryLayoutEdge" ADD CONSTRAINT "FactoryLayoutEdge_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "FactoryLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryLayoutEdge" ADD CONSTRAINT "FactoryLayoutEdge_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "FactoryLayoutNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryLayoutEdge" ADD CONSTRAINT "FactoryLayoutEdge_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "FactoryLayoutNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoryLayoutEdge" ADD CONSTRAINT "FactoryLayoutEdge_conveyor_system_id_fkey" FOREIGN KEY ("conveyor_system_id") REFERENCES "ConveyorSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConveyorSystem" ADD CONSTRAINT "ConveyorSystem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
