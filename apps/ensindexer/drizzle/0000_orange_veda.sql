CREATE SCHEMA "offchain";
--> statement-breakpoint
CREATE TABLE "offchain"."ensnode_metadata" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
