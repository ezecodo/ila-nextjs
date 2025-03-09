import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/utils/password";
import { signInSchema } from "@/lib/zod";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Correo Electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = signInSchema.parse(credentials);
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) throw new Error("Credenciales inválidas.");
          if (!user.emailVerified) {
            throw new Error(
              "Debes verificar tu email antes de iniciar sesión."
            );
          }
          const isValidPassword = await verifyPassword(password, user.password);
          if (!isValidPassword) throw new Error("Credenciales inválidas.");

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }; // ✅ Agregamos `role`
        } catch (error) {
          console.error("❌ Error en la autenticación:", error);
          throw new Error("Error de autenticación.");
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role; // ✅ Agregamos `role` a la sesión
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role; // ✅ Guardamos `role` en el JWT
      }
      return token;
    },
  },
});
