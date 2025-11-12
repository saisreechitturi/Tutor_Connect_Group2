// Schema-derived enums and constraints (source: backend/src/database/Restore/Scheema.sql)
// Keep these in sync with the database schema. Do not change without DB migration.

// Users
export const ROLES = ["student", "tutor", "admin"];

// Sessions
export const SESSION_STATUS = ["scheduled", "in_progress", "completed", "cancelled", "no_show"];
export const SESSION_TYPE = ["online", "in_person"];

// Reviews
export const REVIEWER_TYPE = ["student", "tutor"];
export const RATING_MIN = 1;
export const RATING_MAX = 5;

// Tasks
export const TASK_PRIORITY = ["low", "medium", "high", "urgent"];
export const TASK_STATUS = ["pending", "in_progress", "completed", "cancelled"];
export const TASK_DIFFICULTY = ["easy", "medium", "hard"];
export const TASK_PROGRESS_MIN = 0;
export const TASK_PROGRESS_MAX = 100;

// Availability
export const DAY_OF_WEEK_MIN = 0;
export const DAY_OF_WEEK_MAX = 6;
export const RECURRING_PATTERN = ["weekly", "biweekly", "monthly"];

// Student profiles
export const PREFERRED_LEARNING_STYLE = [
    "visual",
    "auditory",
    "kinesthetic",
    "reading",
    "both",
];

// Tutor profiles
export const PREFERRED_TEACHING_METHOD = ["online", "in_person", "both"];
export const TUTOR_RATING_MIN = 0;
export const TUTOR_RATING_MAX = 5;

// Student progress tracking
export const PROFICIENCY_LEVELS = [
    "beginner",
    "elementary",
    "intermediate",
    "advanced",
    "expert",
];
export const PROGRESS_PERCENT_MIN = 0;
export const PROGRESS_PERCENT_MAX = 100;

// Payments
export const PAYMENT_STATUS = ["pending", "completed", "failed", "refunded"];

// Settings
export const SETTINGS_DATA_TYPE = ["string", "number", "boolean", "json"];

// Utilities
export const isEnumValue = (value, list) => list.includes(value);
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
