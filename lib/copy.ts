// Every user-facing string, grouped by page. The wording comes from docs/copy-deck.md
// (exported from the copy deck doc in Claude Docs); where the deck has no line
// for a moment, the line follows its voice and "Use / Avoid" table.
//
// Components import the group they need from its own module, `import { santa } from
// "@/lib/copy/santa"`, never from this index: importing the index pulls every page's words
// into every page (the bundler can't drop them). Each group
// lives in its own module under lib/copy/, so a page only ships its own words (the reveal
// page /r has a tight JavaScript budget). Placeholders such as [Name] or [amount] are
// small functions: copy.ajo.turnLine({ turn, name, amount, date }).
import { common } from "./copy/common";
import { landing } from "./copy/landing";
import { santa } from "./copy/santa";
import { reveal } from "./copy/reveal";
import { revealScreen } from "./copy/revealScreen";
import { weather } from "./copy/weather";
import { ideas } from "./copy/ideas";
import { ajo } from "./copy/ajo";
import { gifts } from "./copy/gifts";
import { legal } from "./copy/legal";

export { common, landing, santa, reveal, revealScreen, ideas, weather, ajo, gifts, legal };
export const copy = { common, landing, santa, reveal, revealScreen, ideas, weather, ajo, gifts, legal };
