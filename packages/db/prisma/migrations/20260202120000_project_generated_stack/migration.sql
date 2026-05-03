-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('stripe', 'supabase', 'github');

-- CreateTable
CREATE TABLE "ProjectProductSpec" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "specJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectProductSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedRow" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedAppUser" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedAppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectIntegration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "secrets" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectProductSpec_projectId_key" ON "ProjectProductSpec"("projectId");

-- CreateIndex
CREATE INDEX "GeneratedRow_projectId_entity_idx" ON "GeneratedRow"("projectId", "entity");

-- CreateIndex
CREATE INDEX "GeneratedAppUser_projectId_idx" ON "GeneratedAppUser"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedAppUser_projectId_email_key" ON "GeneratedAppUser"("projectId", "email");

-- CreateIndex
CREATE INDEX "ProjectIntegration_projectId_idx" ON "ProjectIntegration"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectIntegration_projectId_type_key" ON "ProjectIntegration"("projectId", "type");

-- AddForeignKey
ALTER TABLE "ProjectProductSpec" ADD CONSTRAINT "ProjectProductSpec_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GeneratedRow" ADD CONSTRAINT "GeneratedRow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GeneratedAppUser" ADD CONSTRAINT "GeneratedAppUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectIntegration" ADD CONSTRAINT "ProjectIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
