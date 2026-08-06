import { natureCoast } from "./natureCoast";
import { spaceCoast } from "./spaceCoast";

/* ============================================================
   THE CORRIDORS

   Every road the trip mode knows about. Add a corridor file next to
   this one, import it, and put it in the list — that is the whole
   registration process. It will appear in the picker automatically.

   See AUTHORING.md for the shape of a corridor and the rules for
   placing zones.
   ============================================================ */

export const CORRIDORS = [natureCoast, spaceCoast];

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

/* ------------------------------------------------------------
   A zone carries either one question inline (q / o / a) or several in
   a `questions` array. Landmarks worth stopping at twice — the pads,
   the VAB — have five; a fishing village has one, and forcing every
   entry into an array to satisfy the code would be a lot of churn for
   no gain.

   Everything downstream goes through here so neither shape has to be
   handled twice. Always returns an array, so callers can just map it.
   ------------------------------------------------------------ */
export function zoneQuestions(zone) {
  if (!zone) return [];
  if (Array.isArray(zone.questions) && zone.questions.length) return zone.questions;
  if (zone.q) return [{ q: zone.q, o: zone.o, a: zone.a }];
  return [];
}
