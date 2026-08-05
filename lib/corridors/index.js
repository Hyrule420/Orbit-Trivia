import { natureCoast } from "./natureCoast";

/* ============================================================
   THE CORRIDORS

   Every road the trip mode knows about. Add a corridor file next to
   this one, import it, and put it in the list — that is the whole
   registration process. It will appear in the picker automatically.

   See AUTHORING.md for the shape of a corridor and the rules for
   placing zones.
   ============================================================ */

export const CORRIDORS = [natureCoast];

/* Each corridor gets a `byId` lookup attached once, here, rather than
   every corridor file building its own. The queue and saved progress
   store zone ids only — never whole question objects — so that editing
   the wording of a question can never corrupt somebody's saved game,
   and this is what turns those ids back into questions. */
export const CORRIDOR_BY_ID = Object.fromEntries(
  CORRIDORS.map((c) => [c.id, { ...c, byId: Object.fromEntries(c.zones.map((z) => [z.id, z])) }])
);

/* Where a first-time player starts. */
export const DEFAULT_CORRIDOR_ID = natureCoast.id;
