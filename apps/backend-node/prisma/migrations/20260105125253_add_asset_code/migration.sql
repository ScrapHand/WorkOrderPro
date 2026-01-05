/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,code]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Asset_tenant_id_code_key" ON "Asset"("tenant_id", "code");
