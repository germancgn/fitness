import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const goalTypeEnum = pgEnum("goal_type", [
  "lose_weight",
  "maintain",
  "gain_muscle",
]);
export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id").primaryKey(),
  gender: genderEnum("gender"),
  height: numeric("height", { precision: 5, scale: 2 }),
  weight: numeric("weight", { precision: 5, scale: 2 }),
  age: integer("age"),
  goalType: goalTypeEnum("goal_type"),
  activityLevel: activityLevelEnum("activity_level"),
  calorieTarget: integer("calorie_target"),
  proteinTarget: integer("protein_target"),
  carbsTarget: integer("carbs_target"),
  fatTarget: integer("fat_target"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
