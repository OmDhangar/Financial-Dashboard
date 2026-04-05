-- DropIndex
DROP INDEX "records_category_id_idx";

-- DropIndex
DROP INDEX "records_created_by_id_idx";

-- DropIndex
DROP INDEX "records_date_idx";

-- DropIndex
DROP INDEX "records_type_idx";

-- CreateIndex
CREATE INDEX "records_deleted_at_date_idx" ON "records"("deleted_at", "date");

-- CreateIndex
CREATE INDEX "records_deleted_at_created_by_id_idx" ON "records"("deleted_at", "created_by_id");

-- CreateIndex
CREATE INDEX "records_deleted_at_category_id_idx" ON "records"("deleted_at", "category_id");

-- CreateIndex
CREATE INDEX "records_deleted_at_type_date_idx" ON "records"("deleted_at", "type", "date");
