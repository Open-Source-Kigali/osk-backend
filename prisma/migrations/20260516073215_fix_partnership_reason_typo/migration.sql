-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Partner'
      AND column_name = 'partershipReason'
  ) THEN
    ALTER TABLE "Partner" RENAME COLUMN "partershipReason" TO "partnershipReason";
  END IF;
END $$;
