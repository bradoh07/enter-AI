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
 * configured it plays muted and looping instead. Nothing here is a brand mark —
 * the copy is the product promise, exactly as specified.
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

      <div className="relative flex h-full flex-col justify-end p-8 lg:p-14">
        <div className="max-w-xl space-y-4">
          <h2 className="font-display text-[1.75rem] font-semibold leading-tight text-ivory sm:text-[2.1rem] lg:text-[2.6rem]">
            {t("auth.tagline.primary")}
          </h2>
          <p className="text-sm leading-relaxed text-ivory/80 sm:text-base lg:text-lg">
            {t("auth.tagline.secondary")}
          </p>
        </div>
      </div>
    </div>
  );
};
