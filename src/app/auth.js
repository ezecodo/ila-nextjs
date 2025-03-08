import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/utils/password";
import { signInSchema } from "@/lib/zod";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma), // Prisma solo en el backend
  ...authConfig, // Reutilizamos la configuración global
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Correo Electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          // ✅ Validamos con Zod antes de buscar en la DB
          const { email, password } = signInSchema.parse(credentials);

          // ✅ Buscamos el usuario en la DB con Prisma
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) throw new Error("Credenciales inválidas.");

          // ✅ Si el usuario no ha verificado su email, bloqueamos el login
          if (!user.emailVerified) {
            throw new Error(
              "Debes verificar tu email antes de iniciar sesión."
            );
          }

          // ✅ Verificamos la contraseña
          const isValidPassword = await verifyPassword(password, user.password);
          if (!isValidPassword) throw new Error("Credenciales inválidas.");

          // ✅ Retornamos el usuario sin la contraseña
          return { id: user.id, email: user.email, name: user.name };
        } catch (error) {
          if (error.name === "ZodError") {
            console.error("❌ Error de validación Zod:", error.errors);
            throw new Error("Datos de entrada inválidos.");
          } else {
            console.error("❌ Error de autenticación:", error.message);
            throw new Error("Error de autenticación.");
          }
        }
      },
    }),
  ],
});
