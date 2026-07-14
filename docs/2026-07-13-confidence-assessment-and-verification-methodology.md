# Confidence Assessment & Verification Methodology — 2026-07-13

**Companion to:** `docs/2026-07-13-migration-strategy-findings.md` (read that first —
this file answers a specific follow-up question raised after it: *how confident
are we, really, that the current codebase correctly translated the C# app, and
how do we measure that quantitatively instead of guessing?*

> **Recovery update — 2026-07-14:** The XML-stub and legacy-fixture blockers
> recorded below are historical findings. The current parser migrates all eight
> committed V1/V2 fixtures and deep-compares their complete environments with the
> C# goldens; `npm test` is 755 passed / 0 failed / 0 skipped. This does not replace
> the still-open official AAS conformance, AASd semantic-fidelity, or complete
> C#-surface parity work described in this document. `[inferred]`

---

## The question

> OK, but I am a bit confused, in simple terms, how confident are you that the
> current codebase was able to translate a part of the C# codebase? How can we
> judge that accurately in a programmatic manner / quantitatively?

## Plain-language answer

Confidence is **not uniform** — it depends on which layer of the app you mean:

- **Data model & parsing** (AAS types, AASX/ZIP parsing, JSON/XML serialization):
  **Moderate-good confidence** something real got translated. There's
  substantial code, it's internally coherent, 539 tests pass against it.
- **Validation engine** (150 AASd-* rules): **Moderate confidence** that
  *something* is implemented for each rule — **low confidence** that each one
  is *correct* per the actual spec, because nobody has checked it against an
  outside authority, only against tests written by the same process that wrote
  the code.
- **Editing UI / plugins** (claimed "97-100% complete" in
  `.kiro/CONSOLIDATED-SUMMARY.md`): **Low confidence.** This was directly
  falsified during the previous session — the context-menu system alone has 48
  TypeScript type errors, meaning code the docs call "complete" doesn't even
  type-check.

**The honest overall answer: there is no trustworthy single percentage yet, and
neither of the two previous agent sessions had one either** — that's exactly
why they produced 42% and 78% and were both wrong. Nobody has done the one
thing that would actually prove it: compare the TypeScript app's output to the
real C# app's output on the same real files.

## Why the existing numbers aren't real measurements

Every "% complete" figure produced so far comes from an LLM reading code and
estimating. That has one specific, structural weakness: **passing tests only
prove the code agrees with itself.** If an agent wrote both the implementation
and the test, a test passing tells you nothing about whether it matches the
original C# behavior — it only tells you the code does what the same agent
*thought* it should do. Self-graded confidence scores (e.g. "0.92/1.0") in the
existing spec docs have this same weakness: they are the model's own estimate
of its own work, not an independent measurement.

## How to measure it for real, programmatically

Ranked from strongest to weakest evidence:

1. **Golden-master differential testing (the real answer).** Run the actual C#
   core (`AasxCsharpLibrary` / `AasCore.Aas3_1` / validation code) headlessly —
   no GUI needed, just a small `dotnet run` console harness — on a batch of
   real `.aasx` files, and dump its output (parsed structure, validation
   errors, XML round-trip) to JSON. Run the *same files* through this
   TypeScript app. Diff the two outputs field-by-field. That gives a real
   number: e.g. "94% of fields match exactly across 40 files," not a vibe.
   - No need to go find sample files — real ones already exist in the C# repo:
     `src/BlazorUI/*.aasx` (Festo, Bosch, Phoenix Contact, a servo motor
     example, a time-series example, among others). Free, ready-made test
     fixtures, already discovered during the previous session's recon.
2. **Run the official IDTA conformance suite
   ([`admin-shell-io/aas-test-engines`](https://github.com/admin-shell-io/aas-test-engines))
   against this repo's validation engine and REST API.** This is a pass/fail
   from an external standards body, not self-graded. "312/340 official
   conformance checks pass" is a number nobody can inflate.
3. **Mechanical symbol/API-surface diffing**, not LLM guessing: a script that
   lists every public C# class/method/endpoint and every TypeScript exported
   symbol/route, and produces a coverage matrix automatically. Cheap,
   deterministic, rerunnable every session so the number can't drift into
   fiction again.
4. **`npm run check` passing is a floor, not a score.** It only proves the TS
   is internally consistent — necessary before any other number means
   anything, but on its own tells you nothing about C# fidelity. It is not
   currently met (261 errors as of 2026-07-13 — see the companion findings
   doc).

## Recommendation

Build item 1 (golden-master differential testing) first — it's the only method
that actually answers "did we correctly translate X," rather than "does our
code compile" or "do our own tests pass." Concretely:

1. Write a small headless C# console harness that loads an `.aasx` file via
   `AasxCsharpLibrary`/`AasCore.Aas3_1`, runs it through parsing, validation,
   and XML/JSON serialization, and dumps the results as JSON.
2. Run that harness against the sample `.aasx` files already sitting in
   `src/BlazorUI/` in the C# repo.
3. Run the same files through this TypeScript app's equivalent code paths.
4. Diff the two JSON outputs field-by-field and report a real match
   percentage, with a list of every mismatch.
5. Only after that harness exists should this project's status docs quote any
   parity percentage — and it should cite the harness run, not an LLM's
   estimate.

This should be sequenced against Task 1–2 in
`docs/2026-07-13-migration-strategy-findings.md` (fixing the `npm run check`
gate) — the TypeScript side needs to be stable enough to compare before a
golden-master diff is meaningful. Recommended order: fix the typecheck gate
first, then build the golden-master harness, then re-baseline all parity
claims from its output.

## Added to the task tracker

This supersedes/refines item 4 in the task table in
`docs/2026-07-13-migration-strategy-findings.md` ("Build a regenerable C#↔TS
parity matrix"). See that file's task table for tracking; this document exists
to preserve the reasoning behind that item so a future session understands
*why* a symbol-diff matrix alone is not sufficient and a golden-master harness
is the higher-priority build.

## 2026-07-14 update: the harness got built, and it worked exactly as intended

Steps 1–4 of the recommendation above are now done: the C# harness
(`AasxGoldenMasterHarness`, in the C# repo), the 8 real `.aasx` fixtures, and
the TypeScript differential test (`tests/integration/golden-master/
aasx-parser.test.ts`) all exist and run. This is the mechanism working
exactly as designed — it caught a real fidelity gap that no amount of
self-reported "% complete" would have surfaced: the TypeScript AASX parser's
XML path is a stub that silently returns an empty environment for every
real-world fixture, and worse, a follow-up dig revealed the fixtures
themselves are legacy AAS V1.0/V2.0 XML (not V3), meaning the actual gap is
a whole legacy-format migration engine, not a simple parser. See
`docs/2026-07-13-migration-strategy-findings.md` §8, task 4, for the full
finding and the pending scoping decision — this is the concrete evidence
that golden-master differential testing was worth building before quoting
any parity number, exactly as recommended above.

Step 5 ("only after that harness exists should status docs quote any parity
percentage") is **still not done** — `.kiro/CONSOLIDATED-SUMMARY.md` has not
yet been re-baselined (task 12 in the main tracker), and per that task's own
notes, doing so productively requires task 4's scoping decision first, since
the harness's own findings are what task 12 needs to report honestly.
