import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

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
          console.error("User not found:", credentials.username);
          return null;
        }

        const user = users[0];

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isValid) {
          console.error("Invalid password for user:", credentials.username);
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
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.userId;
        token.username = user.username;
        token.email = user.email;
        token.state = user.state;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
