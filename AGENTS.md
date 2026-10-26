<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Signed-in pages live under `src/routes/_authenticated.*` (client-only layout with nav + onboarding gate); data is read/written from the browser via the generated client with per-user RLS on every table.
- All AI calls (brain dump sorting, step breakdowns) go through server functions in `src/lib/ai.functions.ts`; the app must stay fully usable when AI fails.
- Pure planner rules (recurrence, cherry caps) live in `src/lib/dates.ts` with tests in `dates.test.ts`.
