// app/[locale]/entities/categories/[id]/layout.js
// Server layout solo para los metadatos (page.js es client component).
import { entityMetadata } from "@/lib/entityMetadata";

export const generateMetadata = entityMetadata("categories");

export default function CategoryLayout({ children }) {
  return children;
}
