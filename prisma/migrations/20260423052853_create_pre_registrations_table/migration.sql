-- CreateTable
CREATE TABLE "pre_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "privacyAgreed" BOOLEAN NOT NULL DEFAULT true,
    "marketingAgreed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pre_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pre_registrations_email_key" ON "pre_registrations"("email");

-- CreateIndex
CREATE INDEX "pre_registrations_email_idx" ON "pre_registrations"("email");
