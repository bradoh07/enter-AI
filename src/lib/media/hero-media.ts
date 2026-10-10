/**
 * Hero media for the sign-in screen.
 *
 * The screen ships with stills. To use a 15-second clip instead, drop the file
 * at `public/media/lemon-tree.mp4` (muted, seamless loop) and point
 * `HERO_VIDEO_SRC` at its public path. The hero then autoplays it, muted and
 * looping, and falls back to the still if the file is missing or cannot be
 * decoded.
 *
 * While the constant is empty no video request is made at all, so nothing 404s
 * in the console and the still is shown directly.
 */
export const HERO_VIDEO_SRC = "";

/** Wide crop for the desktop split layout. */
export const HERO_LANDSCAPE_SRC = `${import.meta.env.BASE_URL}media/hero-lemon-landscape.jpg`;

/** Tall crop for the mobile hero band. */
export const HERO_PORTRAIT_SRC = `${import.meta.env.BASE_URL}media/hero-lemon-portrait.jpg`;
