-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('theory', 'quiz');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('junior', 'middle', 'senior');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published');

-- DropIndex
DROP INDEX "Bookmark_userId_itemId_itemType_key";

-- DropIndex
DROP INDEX "ReviewState_userId_questionId_key";

-- DropIndex
DROP INDEX "Submission_userId_challengeId_idx";

-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "itemId",
ADD COLUMN     "itemSlug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ReviewState" DROP COLUMN "questionId",
ADD COLUMN     "questionSlug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "challengeId",
ADD COLUMN     "challengeSlug" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'theory',
    "topic" TEXT NOT NULL,
    "tags" TEXT[],
    "difficulty" "Difficulty" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "quizOptions" JSONB,
    "followUps" TEXT[],
    "references" JSONB NOT NULL DEFAULT '[]',
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_key" ON "Question"("slug");

-- CreateIndex
CREATE INDEX "Question_status_topic_idx" ON "Question"("status", "topic");

-- CreateIndex
CREATE INDEX "Question_status_difficulty_idx" ON "Question"("status", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_itemSlug_itemType_key" ON "Bookmark"("userId", "itemSlug", "itemType");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewState_userId_questionSlug_key" ON "ReviewState"("userId", "questionSlug");

-- CreateIndex
CREATE INDEX "Submission_userId_challengeSlug_idx" ON "Submission"("userId", "challengeSlug");
