import { grayCards } from "./cardsGray.js";
import { redCards } from "./cardsRed.js";
import { greenCards } from "./cardsGreen.js";
import { blueCards } from "./cardsBlue.js";
import { basicCards } from "./cardsGray.js";

export const cardDatabase = [
  ...basicCards,
  ...redCards,
  ...greenCards,
  ...blueCards,
  ...grayCards,
];
