CREATE SCHEMA IF NOT EXISTS ensnode;

CREATE TABLE "ensnode"."metadata" (
	"ens_indexer_schema_name" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	CONSTRAINT "metadata_pkey" PRIMARY KEY("ens_indexer_schema_name","key")
);
