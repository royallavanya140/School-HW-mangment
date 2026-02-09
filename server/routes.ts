import type { Express } from "express";
import type { Server } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { seed } from "./seed";
import archiver from "archiver";
import PDFDocument from "pdfkit";
import type { Homework, Subject } from "@shared/schema";
import {
  formatHomeworkActivity,
  formatEnglish,
  isTelugu,
  isHindi,
} from "@shared/homework-format";

// ESM: use import.meta.url; CJS bundle: use process.cwd()/server (import.meta is undefined in CJS)
const _serverDir =
  typeof import.meta !== "undefined" && import.meta.url
    ? path.dirname(fileURLToPath(import.meta.url))
    : path.join(process.cwd(), "server");
const FONTS_DIR = path.join(_serverDir, "fonts");

// Layout constants (must match client HomeworkTemplate for same PDF/image format)
const PDF_LAYOUT = {
  pageWidth: 595,
  margin: 50,
  subjectColWidth: 120,
  headerHeight: 40,
  rowHeight: 48,
  headerBg: "#1e40af",
  headerBgRight: "#2563eb",
} as const;

// Professional homework PDF: letterhead style, optional watermark at center, logo in header
function generateHomeworkPDF(
  doc: PDFDocument,
  className: string,
  date: string,
  entries: (Homework & { subjectName: string; teacherName: string })[],
  allSubjects: Subject[],
  schoolName: string,
  logoUrl?: string | null,
  watermarkUrl?: string | null
) {
  const formatDate = (d: string) => {
    const [year, month, day] = d.split("-");
    return `${day}/${month}/${year.slice(-2)}`;
  };

  const { pageWidth, margin, subjectColWidth, headerHeight, rowHeight, headerBg, headerBgRight } = PDF_LAYOUT;
  const contentWidth = pageWidth - margin * 2;
  const startX = margin;
  const homeworkColWidth = contentWidth - subjectColWidth;
  let currentY = 50;

  // ---- TOP ACCENT BAR ----
  doc.fillColor("#1e3a8a").rect(0, 0, pageWidth, 4).fill();
  currentY += 10;

  // ---- HEADER: logo and text never overlap ----
  const logoWidth = 64;
  const logoHeight = 64;
  const textStartX = logoUrl ? startX + logoWidth + 20 : startX;

  if (logoUrl) {
    try {
      doc.image(logoUrl, startX, currentY, { width: logoWidth, height: logoHeight });
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
    }
  }

  doc.fillColor("#0f172a").fontSize(24).font("Helvetica-Bold");
  doc.text(schoolName.toUpperCase(), textStartX, currentY, {
    width: contentWidth - (logoUrl ? logoWidth + 20 : 0),
  });
  currentY += 20;
  doc.fillColor("#475569").fontSize(12).font("Helvetica");
  doc.text("HOMEWORK DIARY", textStartX, currentY, { width: contentWidth });
  currentY += 16;

  const metaW = 160;
  const metaX = startX + contentWidth - metaW;
  doc.strokeColor("#e2e8f0").lineWidth(1).rect(metaX, currentY - 2, metaW, 28).stroke();
  doc.fillColor("#64748b").fontSize(10).font("Helvetica-Bold");
  doc.text(`CLASS ${className.toUpperCase()}`, metaX + 10, currentY + 6, { width: metaW - 20 });
  doc.text(`DATE: ${formatDate(date)}`, metaX + 10, currentY + 16, { width: metaW - 20 });
  currentY += 36;

  // ---- TABLE ----
  doc.fillColor(headerBg).rect(startX, currentY, subjectColWidth, headerHeight).fill();
  doc.fillColor(headerBgRight).rect(startX + subjectColWidth, currentY, homeworkColWidth, headerHeight).fill();
  doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold");
  doc.text("SUBJECT", startX + 14, currentY + headerHeight / 2 - 5, { width: subjectColWidth - 28 });
  doc.text("HOMEWORK / ACTIVITY", startX + subjectColWidth + 14, currentY + headerHeight / 2 - 5, {
    width: homeworkColWidth - 28,
  });
  currentY += headerHeight;

  const subjectsWithHomework = allSubjects.filter((s) => entries.some((e) => e.subjectId === s.id));

  // Register Unicode fonts for Telugu/Hindi if present (avoids gibberish in PDF)
  // PDFKit/fontkit only support static TTF; variable fonts can throw "Unknown font format"
  let hasTeluguFont = false;
  let hasDevanagariFont = false;
  try {
    const teluguPath = path.join(FONTS_DIR, "NotoSansTelugu-Regular.ttf");
    const devanagariPath = path.join(FONTS_DIR, "NotoSansDevanagari-Regular.ttf");
    if (existsSync(teluguPath)) {
      doc.registerFont("NotoTelugu", teluguPath);
      hasTeluguFont = true;
    }
    if (existsSync(devanagariPath)) {
      doc.registerFont("NotoDevanagari", devanagariPath);
      hasDevanagariFont = true;
    }
  } catch (_) {
    hasTeluguFont = false;
    hasDevanagariFont = false;
  }

  for (let i = 0; i < subjectsWithHomework.length; i++) {
    const subject = subjectsWithHomework[i];
    const hw = entries.find((e) => e.subjectId === subject.id)!;
    const isEven = i % 2 === 0;
    const bgFill = isEven ? "#f8fafc" : "#ffffff";
    const borderColor = "#e2e8f0";

    doc.fillColor(bgFill).rect(startX, currentY, subjectColWidth, rowHeight).fill();
    doc.fillColor(bgFill).rect(startX + subjectColWidth, currentY, homeworkColWidth, rowHeight).fill();
    doc.strokeColor(borderColor).lineWidth(0.5);
    doc.rect(startX, currentY, subjectColWidth, rowHeight).stroke();
    doc.rect(startX + subjectColWidth, currentY, homeworkColWidth, rowHeight).stroke();
    doc.fillColor("#1e40af").rect(startX, currentY, 4, rowHeight).fill();

    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold");
    doc.text(subject.name.toUpperCase(), startX + 14, currentY + (rowHeight - 11) / 2 - 2, {
      width: subjectColWidth - 28,
      align: "left",
    });

    const input = {
      activityType: hw.activityType || "",
      subjectName: subject.name,
      source: hw.source,
      chapter: hw.chapter,
      page: hw.page,
      description: hw.description,
    };
    let useLocalized =
      (isTelugu(subject.name) && hasTeluguFont) || (isHindi(subject.name) && hasDevanagariFont);
    let homeworkText = useLocalized ? formatHomeworkActivity(input) : formatEnglish(input);

    const isTest = hw.activityType?.toLowerCase().includes("test");
    if (isTest) {
      doc.fillColor("#b91c1c").font("Helvetica-Bold");
    } else {
      doc.fillColor("#334155").font("Helvetica");
    }

    try {
      if (isTelugu(subject.name) && hasTeluguFont) doc.font("NotoTelugu");
      else if (isHindi(subject.name) && hasDevanagariFont) doc.font("NotoDevanagari");
      else doc.font("Helvetica");
    } catch (_) {
      doc.font("Helvetica");
      homeworkText = formatEnglish(input);
    }

    doc.fontSize(10);
    doc.text(homeworkText, startX + subjectColWidth + 14, currentY + (rowHeight - 10) / 2 - 2, {
      width: homeworkColWidth - 28,
      height: rowHeight - 12,
      ellipsis: true,
    });

    currentY += rowHeight;
  }

  currentY += 24;
  doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(startX, currentY).lineTo(startX + contentWidth, currentY).stroke();
  doc.fillColor("#94a3b8").fontSize(9).font("Helvetica");
  doc.text(`Generated by School Connect · ${schoolName}`, startX, currentY + 10, {
    width: contentWidth,
    align: "center",
  });

  // ---- WATERMARK ON TOP: transparent overlay, circular clip for proper circle ----
  const centerWatermarkUrl = watermarkUrl ?? logoUrl;
  if (centerWatermarkUrl) {
    try {
      const centerX = pageWidth / 2;
      const centerY = 420;
      const watermarkSize = 380;
      const watermarkRadius = watermarkSize / 2;
      doc.save();
      doc.rotate(-45, { origin: [centerX, centerY] });
      doc.circle(centerX, centerY, watermarkRadius);
      doc.clip();
      doc.opacity(0.2);
      doc.image(centerWatermarkUrl, centerX - watermarkRadius, centerY - watermarkRadius, {
        width: watermarkSize,
        height: watermarkSize,
      });
      doc.restore();
    } catch (e) {
      console.error("Error adding watermark to PDF:", e);
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication (Passport)
  setupAuth(app);

  // Seed data
  await seed();

  // === USERS ===
  app.get(api.users.list.path, async (req, res) => {
    // Only admin can list users, or teachers can list... maybe restricted?
    // ideally check req.isAuthenticated() and req.user.role === 'admin'
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const role = req.query.role as 'admin' | 'teacher' | undefined;
    const users = await storage.getUsersByRole(role);
    res.json(users);
  });

  app.post(api.users.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);

    try {
      const input = api.users.create.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Auto-generate password logic if not provided or just strictly follow the rule
      // Rule: FIRST 3 letters of name (UPPERCASE) + LAST 4 digits of mobile number
      let passwordToHash = input.password;

      // If mobile number and name are present, enforce the rule or generate it
      // The user said: "username and password gen is not working properly: userid is mobile number and password is first 3 letter of name full captial + last 4 digits of phone number"
      // So we should enforce this generation here.
      if (input.mobile && input.name) {
         // Username = Mobile Number
         // input.username should already be mobile number from frontend form, but let's ensure it matches or just use mobile as username

         const namePart = input.name.substring(0, 3).toUpperCase();
         const mobilePart = input.mobile.slice(-4);
         passwordToHash = `${namePart}${mobilePart}`;
      }

      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(passwordToHash);

      const user = await storage.createUser({
        ...input,
        password: hashedPassword
      });

      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.users.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);

    await storage.deleteUser(Number(req.params.id));
    res.sendStatus(200);
  });

  app.put(api.users.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);

    try {
      const input = api.users.update.input.parse(req.body);
      
      // Handle password update: only hash if a new password is provided (not TEMP_PASSWORD)
      const updateData: Partial<typeof input> = { ...input };
      
      if (updateData.password) {
        // If password is TEMP_PASSWORD or empty, don't update the password field
        if (updateData.password === "TEMP_PASSWORD" || updateData.password.trim() === "") {
          delete updateData.password;
        } else {
          // Hash the new password
          const { hashPassword } = await import("./auth");
          updateData.password = await hashPassword(updateData.password);
        }
      }
      
      // If name and mobile are being updated, we might want to regenerate password
      // But only if password is not explicitly provided or is TEMP_PASSWORD
      if (updateData.name && updateData.mobile && (!input.password || input.password === "TEMP_PASSWORD")) {
        const namePart = updateData.name.substring(0, 3).toUpperCase();
        const mobilePart = updateData.mobile.slice(-4);
        const passwordToHash = `${namePart}${mobilePart}`;
        const { hashPassword } = await import("./auth");
        updateData.password = await hashPassword(passwordToHash);
      }
      
      const updated = await storage.updateUser(Number(req.params.id), updateData);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === SUBJECTS ===
  app.get(api.subjects.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const subjects = await storage.getSubjects();
    res.json(subjects);
  });

  app.post(api.subjects.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);

    try {
      const input = api.subjects.create.input.parse(req.body);
      const subject = await storage.createSubject(input);
      res.status(201).json(subject);
    } catch (err) {
      return res.status(400).json({ message: "Invalid subject data" });
    }
  });

  app.delete(api.subjects.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);
    await storage.deleteSubject(Number(req.params.id));
    res.sendStatus(200);
  });

  // === HOMEWORK ===
  app.get(api.homework.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const filters = {
      date: req.query.date as string | undefined,
      class: req.query.class as string | undefined
    };

    const homework = await storage.getHomework(filters);
    res.json(homework);
  });

  app.post(api.homework.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'teacher') return res.sendStatus(401);

    try {
      const input = api.homework.create.input.parse(req.body);
      // Allow empty activityType and source - use empty string if not provided
      const homeworkData = {
        ...input,
        activityType: input.activityType || "",
        source: input.source || ""
      };
      const homework = await storage.createHomework(homeworkData);
      res.status(201).json(homework);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.homework.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const input = api.homework.update.input.parse(req.body);
      // Allow empty activityType and source - use empty string if not provided
      const updateData = {
        ...input,
        ...(input.activityType !== undefined && { activityType: input.activityType || "" }),
        ...(input.source !== undefined && { source: input.source || "" })
      };
      const updated = await storage.updateHomework(Number(req.params.id), updateData);
      if (!updated) return res.status(404).json({ message: "Homework not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.homework.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    await storage.deleteHomework(Number(req.params.id));
    res.sendStatus(200);
  });

  // === DOWNLOADS ===
  app.get(api.homework.downloadAll.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);

    const date = req.query.date as string;
    if (!date) return res.status(400).json({ message: "Date required" });

    // Get all homework for date
    const allHomework = await storage.getHomework({ date });
    if (allHomework.length === 0) return res.status(404).json({ message: "No homework found for this date" });

    // Group by class
    const homeworkByClass: Record<string, typeof allHomework> = {};
    for (const hw of allHomework) {
      if (!homeworkByClass[hw.class]) homeworkByClass[hw.class] = [];
      homeworkByClass[hw.class].push(hw);
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment(`homework_${date}.zip`);
    archive.pipe(res);

    const allSubjects = await storage.getSubjects();
    const settings = await storage.getSettings();
    const schoolName = settings?.schoolName || "SCHOOL CONNECT";
    const logoUrl = settings?.logoUrl;
    const watermarkUrl = settings?.watermarkUrl;

    for (const [className, entries] of Object.entries(homeworkByClass)) {
      // Create PDF for each class using the same format as single PDF
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));

      // Set up end handler before generating content
      const pdfPromise = new Promise<void>((resolve) => {
        doc.on('end', () => {
          const result = Buffer.concat(chunks);
          archive.append(result, { name: `${className}.pdf` });
          resolve();
        });
      });

      // Generate PDF content using the same helper function
      generateHomeworkPDF(doc, className, date, entries, allSubjects, schoolName, logoUrl, watermarkUrl);

      doc.end();

      // Wait for PDF generation to finish
      await pdfPromise;
    }

    archive.finalize();
  });

  app.get(api.homework.downloadClass.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const className = req.params.class;
    const date = req.query.date as string;

    if (!date) return res.status(400).json({ message: "Date required" });

    const entries = await storage.getHomework({ date, class: className });
    const allSubjects = await storage.getSubjects();
    const settings = await storage.getSettings();
    const schoolName = settings?.schoolName || "SCHOOL CONNECT";
    const logoUrl = settings?.logoUrl;
    const watermarkUrl = settings?.watermarkUrl;

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=homework_${className}_${date}.pdf`);

    doc.pipe(res);

    // Generate PDF content using the helper function
    generateHomeworkPDF(doc, className, date, entries, allSubjects, schoolName, logoUrl, watermarkUrl);

    doc.end();
  });

  // === SETTINGS ===
  app.get(api.settings.get.path, async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.post(api.settings.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);
    const input = api.settings.update.input.parse(req.body);
    const updated = await storage.updateSettings(input);
    res.json(updated);
  });

  // === PASSWORD CHANGE ===
  app.post(api.auth.changePassword.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const input = api.auth.changePassword.input.parse(req.body);

      // Validate that new password and confirm password match
      if (input.newPassword !== input.confirmPassword) {
        return res.status(400).json({ message: "New password and confirm password do not match" });
      }

      // Get current user from database
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const { comparePasswords } = await import("./auth");
      const isCurrentPasswordValid = await comparePasswords(input.currentPassword, currentUser.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(input.newPassword);
      
      await storage.updateUser(req.user!.id, { password: hashedPassword });

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  return httpServer;
}

12345