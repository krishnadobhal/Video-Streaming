CREATE TABLE IF NOT EXISTS "video_data" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"author" varchar(255) NOT NULL,
	"url" varchar(2083) NOT NULL
);
