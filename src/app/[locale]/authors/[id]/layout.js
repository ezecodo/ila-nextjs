// app/[locale]/authors/[id]/layout.js
// Server layout solo para los metadatos (page.js es client component).
import { entityMetadata } from "@/lib/entityMetadata";

export const generateMetadata = entityMetadata("authors");

export default function AuthorLayout({ children }) {
  return children;
}
