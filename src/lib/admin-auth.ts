import { auth } from '@/lib/auth-server';
import prisma from '@/lib/prisma';

/**
 * Checks whether a given user is a superadmin.
 * A user is a superadmin if:
 * 1. Their email is included in the comma-separated `SUPERADMIN_EMAILS` environment variable.
 * 2. Their database `role` is set to 'superadmin' or 'admin'.
 */
export function isSuperAdminUser(user?: { email?: string | null; role?: string | null } | null): boolean {
  if (!user || !user.email) return false;

  const superAdminEmails = (process.env.SUPERADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = user.email.toLowerCase().trim();

  if (superAdminEmails.includes(userEmail)) {
    return true;
  }

  if (user.role === 'superadmin' || user.role === 'admin') {
    return true;
  }

  return false;
}

/**
 * Server-side guard to verify and extract superadmin user from the active session.
 */
export async function getSuperAdminSession() {
  try {
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.user?.id) {
      return { authorized: false, error: 'Unauthorized: Session required', status: 401 };
    }

    const userId = sessionData.user.id;
    const userEmail = sessionData.user.email;

    // Check database user
    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser && userEmail) {
      dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });
    }

    const superAdminEmails = (process.env.SUPERADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isWhitelisted = userEmail && superAdminEmails.includes(userEmail.toLowerCase().trim());
    const isDbAdmin = dbUser?.role === 'superadmin' || dbUser?.role === 'admin';

    if (!isWhitelisted && !isDbAdmin) {
      return { authorized: false, error: 'Forbidden: Superadmin privileges required', status: 403 };
    }

    return { authorized: true, user: dbUser || sessionData.user };
  } catch (error) {
    console.error('Superadmin guard error:', error);
    return { authorized: false, error: 'Authentication service error', status: 500 };
  }
}
