import bcrypt from "bcryptjs";

// 🔐 Hashea una contraseña antes de guardarla en la base de datos
export async function saltAndHashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// 🔎 Verifica si la contraseña ingresada coincide con la guardada en la base de datos
export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}
