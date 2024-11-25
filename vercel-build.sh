#!/bin/bash
# Instala dependencias
npm install
# Genera el cliente de Prisma
npx prisma generate
# Construye la aplicación
npm run build
