-- DropIndex
DROP INDEX IF EXISTS "Reminder_status_scheduledAt_idx";

-- DropTable
DROP TABLE IF EXISTS "Reminder";

-- DropEnum
DROP TYPE IF EXISTS "ReminderType";
DROP TYPE IF EXISTS "ReminderStatus";
