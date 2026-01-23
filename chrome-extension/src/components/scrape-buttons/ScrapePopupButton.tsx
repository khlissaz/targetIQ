import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { scrapeAndScrollReactions } from "@/services/linkedin/scrapeReaction";
import { scrapeReposts } from "@/services/linkedin/scrapeReposts";
import { LeadI } from "@/types";
import { Button } from "../ui/button";

interface ScrapePopupButtonProps {
  type: "reactions" | "reposts";
  postUrl: string;
  popup: HTMLElement;
}

const ScrapePopupButton: React.FC<ScrapePopupButtonProps> = ({ type, postUrl, popup }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    console.log(`⚡ Scraping ${type} for post:`, postUrl);
    try {
      let data: LeadI[] = [];

      if (type === "reactions") {
        data = await scrapeAndScrollReactions(postUrl, popup);
      } else if (type === "reposts") {
        data = await scrapeReposts(popup);
      }
      console.log('Popup element:', popup);
      setTimeout(() => {
        setLoading(false);
        setDone(true);
      }, 1500);
      return data;
    } catch (err) {
      console.error(`❌ Error scraping ${type}:`, err);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading || done}
      variant={done ? "outline" : "default"}
      size="lg"
      className="w-full my-1"
      aria-label={done ? t('scrape.done') : loading ? t('scrape.loading') : t(`scrape.${type}`)}
    >
      {done ? t('scrape.done') : loading ? t('scrape.loading') : t(`scrape.${type}`)}
    </Button>
  );
};

export default ScrapePopupButton;
