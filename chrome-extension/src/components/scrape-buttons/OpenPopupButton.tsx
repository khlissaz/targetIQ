import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Button } from "../ui/button";

export interface ScrapeReactionsButtonProps {
  post: HTMLElement;
  onClick?: () => void;
  type: "reactions" | "reposts" | "comments";
  loading?: boolean;
  disabled?: boolean;
}


export const OpenPopupButton: React.FC<ScrapeReactionsButtonProps> = ({
  post,
  onClick,
  type,
  loading = false,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const [done, setDone] = React.useState(loading);

  const handleClick = () => {
    setDone(false);
    console.log("⚡ Clicked Scrape button");
    console.log("reactions post:", post);
    if (onClick) {
      onClick();
      setDone(true);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={done || disabled}
      size="lg"
      className="w-full my-1"
      aria-label={done ? t(`scrape.done`) : t(`scrape.${type}`)}
    >
      {done ? t('scrape.done') : t(`scrape.${type}`)}
    </Button>
  );
};
