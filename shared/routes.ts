import { z } from 'zod';
import { insertUserSchema, insertHomeworkSchema, insertSubjectSchema, insertSettingsSchema, users, homework, subjects, settings } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(), // Returns User
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>().nullable(), // User or null
      },
    },
    changePassword: {
      method: 'POST' as const,
      path: '/api/auth/change-password',
      input: z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(1, "New password is required"),
        confirmPassword: z.string().min(1, "Confirm password is required"),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      input: z.object({
        role: z.enum(['admin', 'teacher']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id',
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  subjects: {
    list: {
      method: 'GET' as const,
      path: '/api/subjects',
      responses: {
        200: z.array(z.custom<typeof subjects.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/subjects',
      input: insertSubjectSchema,
      responses: {
        201: z.custom<typeof subjects.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/subjects/:id',
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  homework: {
    list: {
      method: 'GET' as const,
      path: '/api/homework',
      input: z.object({
        date: z.string().optional(),
        class: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof homework.$inferSelect & { subjectName: string; teacherName: string }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/homework',
      input: insertHomeworkSchema,
      responses: {
        201: z.custom<typeof homework.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/homework/:id',
      input: insertHomeworkSchema.partial(),
      responses: {
        200: z.custom<typeof homework.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/homework/:id',
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
      },
    },
    downloadAll: {
      method: 'GET' as const,
      path: '/api/homework/download/all',
      input: z.object({
        date: z.string(),
      }),
      responses: {
        200: z.any(), // Stream/Blob
      },
    },
    downloadClass: {
      method: 'GET' as const,
      path: '/api/homework/download/:class',
      input: z.object({
        date: z.string(),
      }),
      responses: {
        200: z.any(), // Stream/Blob
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/settings',
      input: insertSettingsSchema.partial(),
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
      },
    },
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type { InsertHomework, InsertUser, InsertSubject, InsertSettings } from './schema';
