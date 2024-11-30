ALTER TABLE "email_tokens" DROP CONSTRAINT "unique_id_token";--> statement-breakpoint
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "unique_id_token";--> statement-breakpoint
ALTER TABLE "two_factor_tokens" DROP CONSTRAINT "unique_id_token";