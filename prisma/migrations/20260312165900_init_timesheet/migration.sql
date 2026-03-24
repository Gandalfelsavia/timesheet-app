-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('clients', 'activity_types', 'timesheets');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('imported', 'skipped', 'error');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" BIGSERIAL NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "import_source" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_types" (
    "id" BIGSERIAL NOT NULL,
    "activity_name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "import_source" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheet_entries" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "entry_date" DATE NOT NULL,
    "client_id" BIGINT NOT NULL,
    "activity_type_id" BIGINT NOT NULL,
    "description" TEXT,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_billable" BOOLEAN NOT NULL DEFAULT false,
    "anticipated_expenses" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "fee_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "timesheet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imports" (
    "id" BIGSERIAL NOT NULL,
    "import_type" "ImportType" NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "imported_by" BIGINT NOT NULL,
    "rows_total" INTEGER NOT NULL DEFAULT 0,
    "rows_imported" INTEGER NOT NULL DEFAULT 0,
    "rows_skipped" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'pending',
    "log_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows_log" (
    "id" BIGSERIAL NOT NULL,
    "import_id" BIGINT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "row_payload" JSONB,
    "status" "ImportRowStatus" NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_rows_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_full_name" ON "users"("full_name");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "idx_clients_name" ON "clients"("client_name");

-- CreateIndex
CREATE INDEX "idx_clients_active" ON "clients"("is_active");

-- CreateIndex
CREATE INDEX "idx_activity_types_name" ON "activity_types"("activity_name");

-- CreateIndex
CREATE INDEX "idx_activity_types_active" ON "activity_types"("is_active");

-- CreateIndex
CREATE INDEX "idx_timesheet_user_date" ON "timesheet_entries"("user_id", "entry_date");

-- CreateIndex
CREATE INDEX "idx_timesheet_client_date" ON "timesheet_entries"("client_id", "entry_date");

-- CreateIndex
CREATE INDEX "idx_timesheet_activity_date" ON "timesheet_entries"("activity_type_id", "entry_date");

-- CreateIndex
CREATE INDEX "idx_timesheet_billable" ON "timesheet_entries"("is_billable");

-- CreateIndex
CREATE INDEX "idx_timesheet_entry_date" ON "timesheet_entries"("entry_date");

-- CreateIndex
CREATE INDEX "idx_timesheet_deleted_at" ON "timesheet_entries"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_imports_type" ON "imports"("import_type");

-- CreateIndex
CREATE INDEX "idx_imports_status" ON "imports"("status");

-- CreateIndex
CREATE INDEX "idx_imports_created_at" ON "imports"("created_at");

-- CreateIndex
CREATE INDEX "idx_import_rows_import_id" ON "import_rows_log"("import_id");

-- CreateIndex
CREATE INDEX "idx_import_rows_status" ON "import_rows_log"("status");

-- AddForeignKey
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imports" ADD CONSTRAINT "imports_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows_log" ADD CONSTRAINT "import_rows_log_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
