import CredentialsProvider from "next-auth/providers/credentials";

export default {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Correo Electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // ⚠️ Aquí no usamos Prisma ni Zod porque este archivo se usa en el middleware
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
};
