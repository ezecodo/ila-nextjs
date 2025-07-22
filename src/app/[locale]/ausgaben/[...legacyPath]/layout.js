// app/[locale]/articles/[id]/layout.js

import { generateMetadata } from "./generateMetadata";

export { generateMetadata };

export default function ArticleLayout({ children }) {
  return children;
}
