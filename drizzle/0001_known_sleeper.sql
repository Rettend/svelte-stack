CREATE TABLE `todo` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
