import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma"; // 👈 Asegúrate de tener Prisma disponible

const authConfig = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Correo Electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize() {
        // Este provider no maneja el login aquí
        throw new Error("El middleware no debe manejar autenticación.");
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.AUTH_SECRET,

  /**
   * 👇 Callbacks necesarios para mantener el ROLE disponible
   */
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // si viene de un login, guarda el role
        token.role = user.role;
      } else {
        // si no viene (middleware, refresh, etc.)
        // busca el role en BD sólo si no está en el token
        if (!token.role && token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { role: true },
          });
          token.role = dbUser?.role || "user";
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.role) {
        session.user.role = token.role;
      } else {
        session.user.role = "user";
      }
      return session;
    },
  },
};

export default authConfig;
