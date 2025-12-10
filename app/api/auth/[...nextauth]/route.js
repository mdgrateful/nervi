import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "../../../../lib/supabase";
import bcrypt from "bcryptjs";
import { logError, logSecurityEvent } from "../../../../lib/logger";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!supabase) {
          throw new Error("Database not configured");
        }

        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Normalize username/email to lowercase for case-insensitive login
        const normalizedUsername = credentials.username.toLowerCase().trim();

        // Find user by username OR email (case-insensitive)
        const { data: users, error } = await supabase
          .from("users")
          .select("*")
          .or(`username.eq.${normalizedUsername},email.eq.${normalizedUsername}`);

        if (error || !users || users.length === 0) {
          logSecurityEvent("Failed login attempt - user not found", { operation: "login" });
          return null;
        }

        const user = users[0];

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isValid) {
          logSecurityEvent("Failed login attempt - invalid password", { operation: "login" });
          return null;
        }

        // Update last login
        await supabase
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", user.id);

        // Return user object (without password hash and profile picture)
        // Note: Profile picture is excluded to avoid JWT token size issues
        return {
          id: user.id.toString(),
          userId: user.user_id,
          username: user.username,
          email: user.email,
          state: user.state,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userId = user.userId;
        token.username = user.username;
        token.email = user.email;
        token.state = user.state;
        token.sessionStart = Date.now(); // Track when session was created
      }

      // Validate session age (force re-login if session is stale)
      if (token.sessionStart) {
        const sessionAge = Date.now() - token.sessionStart;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        if (sessionAge > maxAge) {
          logSecurityEvent("Session expired - forcing re-authentication", { operation: "session_validation" });
          throw new Error("Session expired");
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.userId = token.userId;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.state = token.state;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security)
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Force HTTPS in production
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
