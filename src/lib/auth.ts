import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email ?? "";
      return email.endsWith("@ku.th") || email.endsWith(".ku.th");
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        session.user.role = dbUser?.role ?? "STUDENT";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email || !user.id) return;

      const pendingRole = await prisma.pendingRole.findUnique({ where: { email: user.email } });
      if (pendingRole) {
        await prisma.user.update({ where: { id: user.id }, data: { role: pendingRole.role } });
        await prisma.pendingRole.delete({ where: { email: user.email } });
      }

      const pending = await prisma.pendingEnrollment.findMany({ where: { email: user.email } });
      if (pending.length > 0) {
        await prisma.enrollment.createMany({
          data: pending.map((pe) => ({ studentId: user.id, courseId: pe.courseId })),
          skipDuplicates: true,
        });
        await prisma.pendingEnrollment.deleteMany({ where: { email: user.email } });
      }
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};

export const getSession = () => getServerSession(authOptions);
