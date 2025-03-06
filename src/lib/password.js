import bcrypt from "bcryptjs";

// Hashear una contraseña antes de guardarla en la base de datos
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10); // Genera un "salt"
  return bcrypt.hash(password, salt); // Retorna la contraseña hasheada
}

// Comparar una contraseña ingresada con la almacenada en la base de datos
export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}
