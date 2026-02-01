/*
  Warnings:

  - Made the column `latitude` on table `Advert` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `Advert` required. This step will fail if there are existing NULL values in that column.
  - Made the column `latitude` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `postalCode` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Advert" ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL,
ALTER COLUMN "postalCode" SET NOT NULL;
