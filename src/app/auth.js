import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../lib/prisma";
import { ZodError } from "zod";
import { signInSchema } from "@/lib/zod";
import { verifyPassword } from "@/utils/password";

const providers = [
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
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) throw new Error("Credenciales inválidas.");
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        return userWithoutPassword;
      } catch (error) {
        if (error instanceof ZodError) {
          console.error("❌ Error de validación:", error.errors);
          throw new Error("Datos de entrada inválidos.");
        } else {
          console.error("❌ Error de autenticación:", error.message);
          throw new Error("Error de autenticación.");
        }
      }
    },
  }),
];

// 🔥 Generamos `providerMap` excluyendo "credentials"
export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  })
  .filter((provider) => provider.id !== "credentials");

// 🔥 Configuración de Auth.js con la ruta personalizada de SignIn
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: "/auth/signin", // 🔥 Ahora el login usa nuestra ruta personalizada
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});
