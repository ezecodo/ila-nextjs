// app/[locale]/entities/topics/[id]/layout.js
// Server layout solo para los metadatos (page.js es client component).
import { entityMetadata } from "@/lib/entityMetadata";

export const generateMetadata = entityMetadata("topics");

export default function TopicLayout({ children }) {
  return children;
}
