import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();

export const { signIn, signUp, useSession, signOut } = authClient;
