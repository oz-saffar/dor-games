/**
 * Real JPEGs from /public/assets/monster-munch/ (Unsplash License).
 */
const prefix = (() => {
  const baseUrl = import.meta.env.BASE_URL ?? '/';
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${root}assets/monster-munch`;
})();

export const MUNCH_IMAGE_SRC = {
  donut: `${prefix}/donut.jpg`,
  watermelon: `${prefix}/watermelon.jpg`,
  cheese: `${prefix}/cheese.jpg`,
  cookie: `${prefix}/cookie.jpg`,
  broccoli: `${prefix}/broccoli.jpg`,
  block: `${prefix}/block.jpg`,
  crayon: `${prefix}/crayon.jpg`,
};

export const MUNCH_IMAGE_ALT = {
  donut: 'סופגנייה',
  watermelon: 'אבטיח',
  cheese: 'גבינה',
  cookie: 'עוגייה',
  broccoli: 'ברוקולי',
  block: 'קוביית צעצוע',
  crayon: 'צבעים ומכחול',
};
