import { relations } from "drizzle-orm";
import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const nutriscoreGradeEnum = pgEnum("nutriscore_grade", [
  "a",
  "b",
  "c",
  "d",
  "e",
]);

export const ecoscoreGradeEnum = pgEnum("ecoscore_grade", [
  "a",
  "b",
  "c",
  "d",
  "e",
]);

export const foodItems = pgTable("food_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  // Identity
  barcode: text("barcode").unique(),
  offId: text("off_id"),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  brands: text("brands"),
  quantity: text("quantity"),
  categories: text("categories"),

  // Serving info
  servingSize: text("serving_size"),
  servingQuantity: numeric("serving_quantity", { precision: 6, scale: 2 }),

  // Nutriments per 100g
  calories: numeric("calories", { precision: 7, scale: 2 }),
  energyKj: numeric("energy_kj", { precision: 7, scale: 2 }),
  fat: numeric("fat", { precision: 6, scale: 2 }),
  saturatedFat: numeric("saturated_fat", { precision: 6, scale: 2 }),
  carbs: numeric("carbs", { precision: 6, scale: 2 }),
  sugars: numeric("sugars", { precision: 6, scale: 2 }),
  addedSugars: numeric("added_sugars", { precision: 6, scale: 2 }),
  fiber: numeric("fiber", { precision: 6, scale: 2 }),
  protein: numeric("protein", { precision: 6, scale: 2 }),
  salt: numeric("salt", { precision: 6, scale: 2 }),
  sodium: numeric("sodium", { precision: 6, scale: 2 }),

  // Ingredients & allergens
  ingredientsText: text("ingredients_text"),
  allergens: text("allergens"),

  // Scoring
  nutriscoreGrade: nutriscoreGradeEnum("nutriscore_grade"),
  ecoscoreGrade: ecoscoreGradeEnum("ecoscore_grade"),

  // Images
  imageFrontUrl: text("image_front_url"),
  imageIngredientsUrl: text("image_ingredients_url"),
  imageNutritionUrl: text("image_nutrition_url"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const foodLogs = pgTable("food_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").notNull(),
  foodItemId: integer("food_item_id")
    .notNull()
    .references(() => foodItems.id),
  date: date("date").notNull(),
  mealType: mealTypeEnum("meal_type").notNull(),
  quantity: numeric("quantity", { precision: 6, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealTemplates = pgTable("meal_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealTemplateItems = pgTable("meal_template_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  mealTemplateId: integer("meal_template_id")
    .notNull()
    .references(() => mealTemplates.id, { onDelete: "cascade" }),
  foodItemId: integer("food_item_id")
    .notNull()
    .references(() => foodItems.id),
  quantity: numeric("quantity", { precision: 6, scale: 2 }).notNull(),
});

export const foodItemsRelations = relations(foodItems, ({ many }) => ({
  logs: many(foodLogs),
  templateItems: many(mealTemplateItems),
}));

export const foodLogsRelations = relations(foodLogs, ({ one }) => ({
  foodItem: one(foodItems, {
    fields: [foodLogs.foodItemId],
    references: [foodItems.id],
  }),
}));

export const mealTemplatesRelations = relations(mealTemplates, ({ many }) => ({
  items: many(mealTemplateItems),
}));

export const mealTemplateItemsRelations = relations(
  mealTemplateItems,
  ({ one }) => ({
    template: one(mealTemplates, {
      fields: [mealTemplateItems.mealTemplateId],
      references: [mealTemplates.id],
    }),
    foodItem: one(foodItems, {
      fields: [mealTemplateItems.foodItemId],
      references: [foodItems.id],
    }),
  }),
);
