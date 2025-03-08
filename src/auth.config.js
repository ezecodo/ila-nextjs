import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Configuración de autenticación para NextAuth
 */
const authConfig = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Correo Electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize() {
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

// ✅ Exportamos la configuración sin EmailProvider
export default authConfig;
