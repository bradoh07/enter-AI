import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  HERO_LANDSCAPE_SRC,
  HERO_PORTRAIT_SRC,
  HERO_VIDEO_SRC,
} from "@/lib/media/hero-media";

/**
 * Cinematic side of the sign-in screen.
 *
 * A still from the Mediterranean lemon-grove set carries the mood; if a clip is
 * configured it plays muted and looping instead. The brand lockup is centred —
 * the Renasci wordmark in white script, with the slogan set small and quiet
 * beneath it — and the scrim is shaped around that composition.
 */
export const CinematicHero = () => {
  const { t } = useTranslation();
  const [useVideo, setUseVideo] = useState(Boolean(HERO_VIDEO_SRC));

  // Respect a reduced-motion preference: a looping background clip is exactly
  // the kind of motion that setting exists to suppress.
  useEffect(() => {
    if (!HERO_VIDEO_SRC) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setUseVideo(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <div className="relative isolate h-full overflow-hidden bg-brown">
      <picture className="absolute inset-0 block">
        <source media="(min-width: 1024px)" srcSet={HERO_LANDSCAPE_SRC} />
        <img
          src={HERO_PORTRAIT_SRC}
          alt=""
          aria-hidden="true"
          className="block h-full w-full object-cover"
        />
      </picture>

      {useVideo && HERO_VIDEO_SRC ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO_SRC}
          poster={HERO_LANDSCAPE_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={() => setUseVideo(false)}
        />
      ) : null}

      <div className="hero-scrim absolute inset-0" aria-hidden="true" />

      <div className="relative flex h-full flex-col px-8 py-9 lg:px-14 lg:py-12">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-script text-[3.5rem] leading-[1.05] text-brandwhite sm:text-[4.5rem] lg:text-[5.5rem]">
            {t("common.brandName")}
          </p>
          <p className="mt-5 max-w-md text-xs font-medium leading-relaxed tracking-[0.14em] text-ivory/90 sm:mt-6 sm:text-sm lg:text-base">
            {t("auth.tagline.primary")}
          </p>
        </div>

        <div className="mx-auto w-full max-w-md border-t border-ivory/25 pt-5">
          <p className="text-center text-[11px] leading-relaxed text-ivory/65">
            {t("auth.brand.footnote")}
          </p>
        </div>
      </div>
    </div>
  );
};
