import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "teacher"] }).notNull().default("teacher"),
  name: text("name"),
  mobile: text("mobile"),
  assignedClass: text("assigned_class"), // e.g., "10th", "Nursery", "LKG", "UKG"
  createdAt: timestamp("created_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const homework = pgTable("homework", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  class: text("class").notNull(), // The class this homework is for
  date: date("date", { mode: "string" }).notNull(), // YYYY-MM-DD
  activityType: text("activity_type").notNull(), // Reading, Writing, etc.
  source: text("source").default("Textbook"), // Textbook, Material, etc.
  chapter: text("chapter"),
  page: text("page"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").default("My School"),
  logoUrl: text("logo_url"),
  watermarkUrl: text("watermark_url"),
});

// === RELATIONS ===

export const homeworkRelations = relations(homework, ({ one }) => ({
  teacher: one(users, {
    fields: [homework.teacherId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [homework.subjectId],
    references: [subjects.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  homeworks: many(homework),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertHomeworkSchema = createInsertSchema(homework).omit({ id: true, createdAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Homework = typeof homework.$inferSelect;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;

export type SchoolSettings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Request types
export type CreateUserRequest = InsertUser;
export type UpdateUserRequest = Partial<InsertUser>;
export type CreateHomeworkRequest = InsertHomework;
export type UpdateSettingsRequest = Partial<InsertSettings>;

// Response types
export type UserResponse = Omit<User, "password">;
export type HomeworkResponse = Homework & { 
  subjectName: string; 
  teacherName: string;
};
