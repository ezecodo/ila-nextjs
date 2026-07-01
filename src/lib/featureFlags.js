import { prisma } from "@/lib/prisma";

// Flags de experimentos del "Cuarto", persistidos en la tabla genérica
// AppSetting (key="featureFlags"). `value` es un JSON con la audiencia por
// feature: quién puede ver cada función.
const FLAGS_KEY = "featureFlags";

export const DEFAULT_FLAGS = {
  listen: {
    admin: true,
    digitalabo: false,
    translator: false,
    user: false,
  },
  globila: {
    admin: true,
    digitalabo: false,
    translator: false,
    user: false,
  },
};

// Mezcla (1 nivel por feature) defaults + guardado, así nuevos flags añadidos
// al código aparecen aunque la row vieja no los tenga.
function mergeWithDefaults(saved) {
  const out = {};
  for (const feature of Object.keys(DEFAULT_FLAGS)) {
    out[feature] = { ...DEFAULT_FLAGS[feature], ...(saved?.[feature] || {}) };
  }
  return out;
}

export async function readFlags() {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: FLAGS_KEY },
    });
    return mergeWithDefaults(row?.value || null);
  } catch (error) {
    console.error("❌ Error leyendo feature-flags:", error);
    return mergeWithDefaults(null);
  }
}

export async function writeFlags(next) {
  const merged = mergeWithDefaults(next);
  await prisma.appSetting.upsert({
    where: { key: FLAGS_KEY },
    create: { key: FLAGS_KEY, value: merged },
    update: { value: merged },
  });
  return merged;
}
