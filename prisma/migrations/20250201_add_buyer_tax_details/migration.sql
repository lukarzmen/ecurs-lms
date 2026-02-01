-- AlterTable
ALTER TABLE "public"."EducationalPathPurchase" ADD COLUMN     "buyerAddressLine1" VARCHAR(255),
ADD COLUMN     "buyerAddressLine2" VARCHAR(255),
ADD COLUMN     "buyerCity" VARCHAR(120),
ADD COLUMN     "buyerCompanyName" VARCHAR(255),
ADD COLUMN     "buyerCountry" VARCHAR(2),
ADD COLUMN     "buyerName" VARCHAR(255),
ADD COLUMN     "buyerPhone" VARCHAR(50),
ADD COLUMN     "buyerPostalCode" VARCHAR(30),
ADD COLUMN     "buyerState" VARCHAR(120),
ADD COLUMN     "buyerTaxId" VARCHAR(50),
ADD COLUMN     "buyerTaxIdType" VARCHAR(50),
ADD COLUMN     "buyerType" VARCHAR(30);

-- AlterTable
ALTER TABLE "public"."UserCoursePurchase" ADD COLUMN     "buyerAddressLine1" VARCHAR(255),
ADD COLUMN     "buyerAddressLine2" VARCHAR(255),
ADD COLUMN     "buyerCity" VARCHAR(120),
ADD COLUMN     "buyerCompanyName" VARCHAR(255),
ADD COLUMN     "buyerCountry" VARCHAR(2),
ADD COLUMN     "buyerName" VARCHAR(255),
ADD COLUMN     "buyerPhone" VARCHAR(50),
ADD COLUMN     "buyerPostalCode" VARCHAR(30),
ADD COLUMN     "buyerState" VARCHAR(120),
ADD COLUMN     "buyerTaxId" VARCHAR(50),
ADD COLUMN     "buyerTaxIdType" VARCHAR(50),
ADD COLUMN     "buyerType" VARCHAR(30);
