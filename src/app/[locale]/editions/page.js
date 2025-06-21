import LastestEdition from "../components/Editions/LatestEdition";
import { useTranslations } from "next-intl";

export default function EditionsPage() {
  const t = useTranslations("dossiers");
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">{t("dossiers")}</h2>
      <LastestEdition />
    </div>
  );
}
