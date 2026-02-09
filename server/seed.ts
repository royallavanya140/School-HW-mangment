import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seed() {
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    const password = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password,
      role: "admin",
      name: "Admin User",
    });
    console.log("Admin user created");
  }

  const existingDev = await storage.getUserByUsername("dev");
  if (!existingDev) {
    const devPassword = await hashPassword("dev123");
    await storage.createUser({
      username: "dev",
      password: devPassword,
      role: "admin",
      name: "Dev Admin",
    });
    console.log("Dev admin user created");
  }

  const subjects = ["Telugu", "Hindi", "English", "Maths", "Science", "EVS", "Biology", "Physics", "Social"];
  const existingSubjects = await storage.getSubjects();
  if (existingSubjects.length === 0) {
      for (const name of subjects) {
          await storage.createSubject({ name });
      }
      console.log("Default subjects created");
  }
}
