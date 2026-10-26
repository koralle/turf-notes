CREATE TABLE `passkeys` (
	`id` text PRIMARY KEY,
	`name` text,
	`user_id` text NOT NULL,
	`public_key` text NOT NULL,
	`credential_id` text NOT NULL,
	`counter` integer NOT NULL,
	`device_type` text NOT NULL,
	`backed_up` integer NOT NULL,
	`transports` text,
	`aaguid` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_passkeys_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `users` ADD `password_sign_in_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `passkeys_credential_id` ON `passkeys` (`credential_id`);--> statement-breakpoint
CREATE INDEX `passkeys_user_id` ON `passkeys` (`user_id`);