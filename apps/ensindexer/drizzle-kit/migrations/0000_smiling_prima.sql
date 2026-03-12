CREATE SCHEMA IF NOT EXISTS ensnode;

CREATE TABLE "ensnode"."ensnode_metadata" (
	"ens_indexer_ref" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	CONSTRAINT "ensnode_metadata_pkey" PRIMARY KEY("ens_indexer_ref","key")
);
