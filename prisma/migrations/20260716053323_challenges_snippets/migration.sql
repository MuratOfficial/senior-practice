-- CreateEnum
CREATE TYPE "ChallengeDifficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "difficulty" "ChallengeDifficulty" NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "hints" TEXT[],
    "languages" JSONB NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snippet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snippet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");

-- CreateIndex
CREATE INDEX "Challenge_status_category_idx" ON "Challenge"("status", "category");

-- CreateIndex
CREATE INDEX "Challenge_status_difficulty_idx" ON "Challenge"("status", "difficulty");

-- CreateIndex
CREATE INDEX "Snippet_userId_createdAt_idx" ON "Snippet"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
