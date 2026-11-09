// app/[locale]/entities/regions/[id]/layout.js
// Server layout solo para los metadatos (page.js es client component).
import { entityMetadata } from "@/lib/entityMetadata";

export const generateMetadata = entityMetadata("regions");

export default function RegionLayout({ children }) {
  return children;
}
