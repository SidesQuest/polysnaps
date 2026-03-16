import { base } from "$app/paths";

const UI = `${base}/assets/ui`;
const FRAMES = `${UI}/1%20Frames`;
const BARS = `${UI}/2%20Bars`;
const ICONS = `${UI}/3%20Icons/Icons`;
const BUTTONS2 = `${UI}/3%20Icons/Buttons2`;
const BUTTONS = `${UI}/6%20Buttons`;
const DECOR = `${UI}/9%20Other/1%20Decor`;
const SKILL_ICONS = `${UI}/9%20Other/3%20Skill%20icons`;

export const frame = (n) => `${FRAMES}/Frame_${String(n).padStart(2, "0")}.png`;
export const button = (n) =>
  `${BUTTONS}/Button_${String(n).padStart(2, "0")}.png`;
export const button2 = (n) =>
  `${BUTTONS2}/Button2_${String(n).padStart(2, "0")}.png`;
export const icon = (n) => `${ICONS}/Icon_${String(n).padStart(2, "0")}.png`;
export const bar = (type, n) => `${BARS}/${type}Bar${n}.png`;
export const decor = (n) => `${DECOR}/${n}.png`;
export const skillIcon = (n) =>
  `${SKILL_ICONS}/Skillicon7_${String(n).padStart(2, "0")}.png`;

export const ASSET = {
  panel: {
    tl: frame(1),
    t: frame(2),
    tr: frame(3),
    l: frame(4),
    c: frame(5),
    r: frame(6),
    bl: frame(7),
    b: frame(9),
    br: frame(3),
  },
  btnRed: { l: button(1), c: button(2), r: button(3) },
  btnPurple: { l: button(7), c: button(8), r: button(9) },
  btnGreen: button2(7),
  btnRedSmall: button2(1),
  btnPurpleSmall: button2(13),
  energyBar: bar("Energy", 1),
  healthBar: bar("Health", 1),
  closeX: frame(8),
  decor: {
    wires1: decor(1),
    wires3: decor(3),
    wires7: decor(7),
    wires8: decor(8),
  },
};
