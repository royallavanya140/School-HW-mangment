import { db, pool } from "./db";
import {
  users, subjects, homework, settings,
  type User, type InsertUser, type Subject, type InsertSubject,
  type Homework, type InsertHomework, type SchoolSettings, type InsertSettings
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role?: 'admin' | 'teacher'): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Subjects
  getSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  deleteSubject(id: number): Promise<void>;

  // Homework
  getHomework(filters: { date?: string; class?: string }): Promise<(Homework & { subjectName: string; teacherName: string })[]>;
  createHomework(entry: InsertHomework): Promise<Homework>;
  updateHomework(id: number, updates: Partial<InsertHomework>): Promise<Homework | undefined>;
  deleteHomework(id: number): Promise<void>;

  // Settings
  getSettings(): Promise<SchoolSettings>;
  updateSettings(updates: Partial<InsertSettings>): Promise<SchoolSettings>;
  
  // Session store helpers
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsersByRole(role?: 'admin' | 'teacher'): Promise<User[]> {
    if (role) {
      return await db.select().from(users).where(eq(users.role, role));
    }
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    return subject;
  }

  async deleteSubject(id: number): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  // Homework
  async getHomework(filters: { date?: string; class?: string }): Promise<(Homework & { subjectName: string; teacherName: string })[]> {
    const conditions = [];
    if (filters.date) conditions.push(eq(homework.date, filters.date));
    if (filters.class) conditions.push(eq(homework.class, filters.class));

    const results = await db.select({
      id: homework.id,
      teacherId: homework.teacherId,
      subjectId: homework.subjectId,
      class: homework.class,
      date: homework.date,
      activityType: homework.activityType,
      source: homework.source,
      chapter: homework.chapter,
      page: homework.page,
      description: homework.description,
      createdAt: homework.createdAt,
      subjectName: subjects.name,
      teacherName: users.name
    })
    .from(homework)
    .leftJoin(subjects, eq(homework.subjectId, subjects.id))
    .leftJoin(users, eq(homework.teacherId, users.id))
    .where(and(...conditions))
    .orderBy(desc(homework.createdAt));

    // @ts-ignore - TS sometimes struggles with join result types, but the shape matches
    return results.map(r => ({
      ...r,
      subjectName: r.subjectName || 'Unknown',
      teacherName: r.teacherName || 'Unknown'
    }));
  }

  async createHomework(insertHomework: InsertHomework): Promise<Homework> {
    const [entry] = await db.insert(homework).values(insertHomework).returning();
    return entry;
  }

  async updateHomework(id: number, updates: Partial<InsertHomework>): Promise<Homework | undefined> {
    const [entry] = await db.update(homework).set(updates).where(eq(homework.id, id)).returning();
    return entry;
  }

  async deleteHomework(id: number): Promise<void> {
    await db.delete(homework).where(eq(homework.id, id));
  }

  // Settings
  async getSettings(): Promise<SchoolSettings> {
    const [existing] = await db.select().from(settings);
    if (!existing) {
      const [created] = await db.insert(settings).values({}).returning();
      return created;
    }
    return existing;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<SchoolSettings> {
    const current = await this.getSettings();
    const [updated] = await db.update(settings).set(updates).where(eq(settings.id, current.id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
