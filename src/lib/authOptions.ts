import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Username and password",
      credentials: {
        username: { label: "Username", type: "text" },
        email: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const username = (credentials?.username ?? credentials?.email)?.trim().toLowerCase();
        const password = credentials?.password;

        console.log("[auth] username:", JSON.stringify(username), "password length:", password?.length, "password:", JSON.stringify(password));

        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { email: username } });
        console.log("[auth] user found:", !!user);
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        console.log("[auth] isValid:", isValid);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    }
  }
};
