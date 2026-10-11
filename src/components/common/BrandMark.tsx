import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "px-2.5 py-1 text-[1.05rem]",
  md: "px-3 py-1.5 text-[1.3rem]",
  lg: "px-4 py-2 text-[1.7rem]",
} as const;

/**
 * The Renasci logotype.
 *
 * The wordmark is pure white by brand specification. White sitting directly on
 * this app's ivory surfaces would be invisible, so the mark carries its own
 * deep-brown ground — the colour stays exactly #FFFFFF while the mark stays
 * legible, which is the stated priority. The plate is the only place a brand
 * colour is used as a surface for type.
 */
export const BrandMark = ({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) => {
  const { t } = useTranslation();
  const name = t("common.brandName");

  return (
    <Link
      to="/dashboard"
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center rounded-md bg-brown transition-opacity hover:opacity-90",
        SIZES[size],
        className,
      )}
    >
      <span className="font-script leading-none text-brandwhite">{name}</span>
    </Link>
  );
};
