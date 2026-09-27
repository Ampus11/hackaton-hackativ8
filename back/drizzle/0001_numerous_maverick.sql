ALTER TABLE "reports" ALTER COLUMN "object_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sequences" ALTER COLUMN "object_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sequences" ALTER COLUMN "original_filename" DROP NOT NULL;