import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Button } from "../ui/button";

interface ScrapeButtonProps {
  type: "reactions" | "reposts" | "comments";
  onClick?: () => void | Promise<any>;
  disabled?: boolean;
}

const ScrapeButton: React.FC<ScrapeButtonProps> = ({ type, onClick, disabled }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    if (onClick) await onClick();
    setLoading(false);
    setDone(true);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading || done || disabled}
      size="lg"
      variant= "default"
      aria-label={done ? t('scrape.done') : loading ? t('scrape.loading') : t(`scrape.${type}`)}
    >
      {done ? t('scrape.done') : loading ? t('scrape.loading') : t(`scrape.${type}`)}
    </Button>
  );
};

export default ScrapeButton;