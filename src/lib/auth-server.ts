import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL || process.env.NEON_AUTH_BASE_URL || "",
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || "default_super_secret_for_development",
  },
});
