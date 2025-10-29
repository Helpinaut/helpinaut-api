-- DropForeignKey
ALTER TABLE "public"."Advert" DROP CONSTRAINT "Advert_ownerId_fkey";

-- AlterTable
ALTER TABLE "Advert" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Advert" ADD CONSTRAINT "Advert_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
