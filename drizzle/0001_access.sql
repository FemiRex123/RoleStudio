CREATE TABLE studio_users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0, blocked INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE TABLE studio_grants (user_id TEXT NOT NULL, project_id TEXT NOT NULL, role TEXT NOT NULL, PRIMARY KEY(user_id,project_id));
