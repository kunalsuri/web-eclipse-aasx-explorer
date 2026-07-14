<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# C# to TypeScript feature-parity audit — 2026-07-14

> Entire report status: `[inferred]` until human review. Audited against the
> `_external_source/` snapshot at C# commit `d1618f72` and the current web working
> tree. “No implementation evidence” means exact capability, symbol, route,
> component-import, dependency, and test searches found no current implementation;
> it does not claim that no vaguely adjacent code exists.

## Executive verdict

The current web application contains a strong beginning, but **no end-user C#
capability is proven 100% feature-complete under a strict behavioral-parity bar**.
One developer-facing compatibility seam is complete in its deliberately narrow
scope: the TypeScript parser deep-equals the eight committed C# golden
environments.

The 45-item source inventory breaks down as follows:

| Classification | Count | Meaning |
|---|---:|---|
| 100% proven test seam | 1 | F24 parser golden-master consumer; not an end-user product feature |
| Partial implementation | 11 | Meaningful current code exists, but acceptance behavior is missing or unreachable |
| Scaffold / adjacent-only | 4 | Named UI/contracts/stubs exist without an operable feature |
| No implementation evidence | 26 | No behavior matching the source capability was found |
| Merge/defer | 3 | F04 is legacy overlap; F20 and F45 are incomplete/dormant upstream |

The denominator for active product-port work is therefore 41 capabilities after
excluding the developer test seam and the three merge/defer items: **0 proven
complete, 11 partial, 4 scaffolded, and 26 not implemented**. This is a coverage
count, not a fabricated weighted percentage; the capabilities vary too much in
size to average honestly.

Historical “78%+” and “42%” claims are not reusable parity measurements. They
score selected foundations or planned P0 tasks, include unmounted code as
implemented, and do not apply the 45-feature source inventory or C# differential
tests consistently.

## Evidence actually executed

- `npm test`: **51 test files, 755 tests passed, 0 failed, 0 skipped**.
- Golden-master suite: all eight fixtures parse and their complete TypeScript
  environments deep-equal the committed C# environments.
- Route composition: eight live application routes; five substantial server
  routers are present but not mounted.
- Exact feature searches: no source implementation evidence for AML, BMEcat,
  SAMM/RDF, W3C Thing Description, OPC UA/NodeSet, JSON Schema generation,
  AASX File Server SDK, MQTT, editable automation scripts, UML/AsciiDoc export,
  image maps, MTP, PCN, or Simulation Model Description.
- Synthetic AASX repro: a package containing supplementary `manual.xml`,
  `config.json`, and `readme.txt` returns only `readme.txt`; the current parser
  drops all supplementary XML and JSON parts.
- Validation inspection: 150 unique rule IDs are registered, but **35 are direct
  no-ops** whose validator is exactly `() => []`: AASd-031..044, AASd-050, and
  AASd-078..097.

## Foundation assessment

| Foundation | Current reality | Verdict |
|---|---|---|
| AAS type model | `shared/aas-v3-types.ts` models the main environment, identifiable types, references, IEC 61360 data, and concrete SME variants. It labels itself AAS V3.0 while the reference inventory is AAS 3.1; no generated API-surface comparison proves completeness. | Substantial, not 100% proven |
| AASX reading | `shared/aas-parser.ts` handles JSON and XML environments, including legacy V1/V2 migration. Eight real fixtures deep-equal C# environment output. | Strongest translated core |
| AASX package fidelity | No writer preserves OPC relationships, environment part replacement, supplementary files, thumbnails, and MIME metadata. Supplementary XML/JSON are dropped by extraction. | Incomplete |
| Environment mutation | Property and structure services mutate `*-environment.json` sidecars. The live download returns the original uploaded package; edits are not repackaged. | Incomplete product boundary |
| Validation | A large internal engine and test suite exists, but 35 registered rules are no-ops and no official IDTA conformance run exists. Repair/finalize/SMT comparison are absent. | Substantial, not spec-complete |
| Search | Indexing and search APIs exist; the search UI is not composed into the live viewer and replace/history navigation is absent. | Partial |
| Plugin contract | Typed registry/loader/API infrastructure and synthetic tests exist. Routes/UI are unmounted and no concrete plugin is registered from source. | Infrastructure only |

## Full 45-capability matrix

| ID | C# capability | Current status | Current evidence and decisive gap |
|---|---|---|---|
| F01 | Package create/open/save/close | **Partial** | Manager can create metadata/environment sidecars, upload, parse, list, download, and delete. New “packages” point download metadata at JSON, and edits never rewrite the original AASX; no close/dirty/auxiliary/supplementary lifecycle. |
| F02 | Desktop AAS tree browsing/editing | **Partial** | Live tree, selection, Property edits, and tested mutation services exist. Rich element editing, move/reorder/clipboard/undo composition is not live, and changes stop at the environment sidecar. |
| F03 | Browser-based AAS exploration | **Partial** | `/aas-viewer` loads, summarizes, browses, selects, edits ordinary properties, and validates. It composes the basic viewer, not the integrated editor/search/export/plugin experience; no browser E2E suite. |
| F04 | Legacy browser viewer/editor | **Merge/defer** | Correctly treated as overlap with F03 rather than a second frontend. Unique directory-scan/repository behaviors are not separately characterized. |
| F05 | Find, replace, navigation | **Partial** | Search engine and mounted APIs exist; search UI is unused. Replace is absent and breadcrumb clicks only log the target rather than selecting it. |
| F06 | Local/remote repositories and registries | **Partial** | Local server package listing/storage is real. No AAS Repository/Registry client, remote auth, pagination, upload/update contract, or compatible local index exists; `/workspaces` is placeholder UI. |
| F07 | Validation, repair, finalization, SMT reports | **Partial** | Live diagnostics/reports and many tests exist. Thirty-five of 150 registered rules are direct no-ops; repair, finalization, SMT validation/comparison, C# diagnostic equality, and official conformance are absent. |
| F08 | Signing, certificate validation, encryption/decryption | **No implementation evidence** | JWT signing is account authentication, not AAS/package cryptography. No AAS signature, certificate-chain, canonical-byte, encryption, or decryption service/test found. |
| F09 | Template/plugin/SAMM model creation | **Partial** | Built-in empty, digital-nameplate, and technical-data environment generators exist. IDTA services are stubs, plugin generators are unavailable, and SAMM creation is absent. |
| F10 | IEC CDD and ECLASS import | **Partial** | Routed search UI and REST-shaped adapters exist. No current contract tests prove those external endpoints, the C# spreadsheet/OntoML parsers are absent, and the live Import callback is TODO. |
| F11 | Local JSON submodel import/export | **Partial** | Whole-environment JSON export exists. Selected-submodel JSON import/attach/collision handling and standards-compatible cross-language fixtures do not. |
| F12 | AutomationML round-trip | **No implementation evidence** | Generic AAS XML serialization is not CAEX/AutomationML. No AML dependency, mapper, route, or fixture found. |
| F13 | BMEcat and CSV population | **No implementation evidence** | CSV export is adjacent but does not populate a selected submodel. No BMEcat parser or CSV import mapping workflow found. |
| F14 | BAMM/SAMM interchange | **No implementation evidence** | No RDF/Turtle parser, namespace graph model, import/export mapper, or test found. |
| F15 | W3C Thing Description round-trip | **No implementation evidence** | No TD/JSON-LD types, contexts, forms/security mapping, route, or fixture found. |
| F16 | OPC UA NodeSet conversion | **No implementation evidence** | No NodeSet parser/mapping code or dependency found. |
| F17 | JSON Schema export | **No implementation evidence** | JSON data export exists, but no JSON Schema generator or schema export endpoint exists. |
| F18 | Package automation CLI | **No implementation evidence** | Setup/admin/build scripts are operational tooling, not a headless package command surface. |
| F19 | AASX File Server REST SDK | **No implementation evidence** | No file-server client, endpoint models, pagination/auth handling, or contract tests found. |
| F20 | Legacy REST console host | **Defer** | Upstream inventory itself marks this incomplete/UNSURE and recommends not porting it. Current Express APIs are a new web boundary, not a translation of this legacy host. |
| F21 | OPC UA server and NodeSet export | **No implementation evidence** | No OPC UA server dependency, address-space builder, NodeSet export, or integration test found. |
| F22 | AAS events and MQTT publication | **No implementation evidence** | BasicEventElement types/validation are data-model support only. No event dispatch, MQTT client/broker adapter, topic mapping, or test found. |
| F23 | Editable automation scripts | **No implementation evidence** | No script model/editor/executor, sandbox, event hooks, or failure-isolation tests found. |
| F24 | Reproducible golden-master snapshots | **100% proven test seam** | Eight committed C# snapshots are consumed by an active TS differential suite and complete environments deep-equal. The generator correctly remains in the C# repo; validation/package-byte parity is outside this current seam. |
| F25 | Plugin discovery, menus, visual extensions | **Scaffold** | Registry/loader/contracts and synthetic tests exist. Plugin routes and manager UI are unmounted; visual-extension calls are TODO; no concrete source plugin exists. |
| F26 | Advanced text editing | **No implementation evidence** | Ordinary property inputs and inline editing are not the source plugin's multi-file text editor with search/replace and save-back semantics. |
| F27 | Asset Interfaces monitoring/operations | **No implementation evidence** | No interface-description runtime, live status/operation invocation, credentials, or adapter tests found. |
| F28 | BOM/package-relationship graphing | **No implementation evidence** | No graph construction/layout/interaction/export implementation found. Dashboard charts are unrelated sample analytics. |
| F29 | Contact information management | **No implementation evidence** | No Contact Information SMT-specific editor/viewer/import behavior found. Account profile contacts are unrelated. |
| F30 | Digital nameplate presentation | **Partial** | Package creation can seed three nameplate properties. No template-version-aware nameplate renderer, grouped presentation, media/marking handling, or source-parity fixture exists. |
| F31 | Document shelf/handover documentation | **Scaffold** | `DocumentShelfPanel.tsx` exists but is unimported by live composition and contains TODO API/download paths. No document entity service or package-file integration is live. |
| F32 | Tabular submodel import/export | **Partial** | Mounted CSV/Excel exports and Excel preview parsing exist. Export UI is not composed, Excel import does not apply updates, and no C# table-format round-trip fixture exists. |
| F33 | UML/AsciiDoc SMT documentation export | **No implementation evidence** | No UML/PlantUML/AsciiDoc generator or route found. |
| F34 | Time-series spreadsheet import | **No implementation evidence** | Excel preview parsing is generic property update parsing, not time-series block/channel import. |
| F35 | Bulk semantic-ID replacement | **No implementation evidence** | General bulk-update scaffolding exists, but no semantic-ID mapping plan, preview, reference-aware replacement, or test found. |
| F36 | Schema-driven generic forms | **No implementation evidence** | Hard-coded element creation forms are adjacent, not JSON-schema form rendering with recursive AAS binding. |
| F37 | Interactive image maps | **No implementation evidence** | No region model, overlay editor, image-map renderer, or package resource mapping found. |
| F38 | Known SMT guidance | **Scaffold** | IDTA page/components/contracts exist, but the route and router are unmounted; hooks return empty values and server services throw Not implemented. |
| F39 | Module Type Package visualization | **No implementation evidence** | No MTP parser, topology renderer, or live-value binding found. |
| F40 | Live/recorded data plotting | **No implementation evidence** | Recharts is used for static dashboard sample data, not AAS time-series or live source plotting. |
| F41 | Product Change Notification review/import | **No implementation evidence** | No PCN parser, diff/review workflow, or selected update import found. |
| F42 | Technical Data viewer | **Scaffold** | A standalone `TechnicalDataPanel.tsx` and a minimal creation template exist, but the panel is not imported into live composition and no SMT-specific service/test exists. |
| F43 | Live OPC UA value refresh | **No implementation evidence** | No OPC UA client, endpoint/session/subscription handling, refresh scheduler, or quality/timestamp mapping found. |
| F44 | Embedded web browser | **No implementation evidence / optional** | A document preview iframe is not a registered browser plugin with navigation/lifecycle integration. Source inventory marks this optional. |
| F45 | Simulation Model Description generation | **Defer** | Upstream feature is dormant and only partially confirmed; source inventory recommends not porting it yet. |

## Parity blockers that invalidate broad “complete” claims

1. **There is no AASX write path.** Creation, edits, structure changes, backup,
   and restore target JSON sidecars. Download targets a different file. Until an
   OPC-aware writer replaces the environment part and preserves relationships and
   supplementary bytes, F01/F02/F03 cannot close.
2. **Constraint count is being mistaken for constraint behavior.** The count test
   proves registration and uniqueness only. At least 35 rules cannot emit a
   diagnostic under any input.
3. **Reachability is fragmented.** The richer integrated explorer, XML UI/router,
   update router, plugin UI/router, and IDTA UI/router exist in source but are not
   current application capabilities.
4. **Self-tests dominate.** With the exception of eight parser environments, tests
   do not compare behavior with C# or an external standards authority.
5. **Specialized ports are mostly absent.** The long tail is not cosmetic UI; it
   includes cryptography, repositories, protocol clients/servers, format mappers,
   plugin-specific domain models, and live data systems.

## Recommended implementation sequence

### P0 — Make the current core truthful and package-safe

1. Implement an OPC-aware AASX writer and make create/edit/save/download operate on
   one package state. Add byte/relationship/supplementary-file round-trip fixtures.
2. Replace all 35 no-op AASd rules with spec-derived behavior or remove them from
   the advertised count. Run the official IDTA conformance suite.
3. Decide which integrated editor is canonical, mount its required routes, and add
   browser-level tests for create/edit/move/delete/undo/save/reopen/download.
4. Protect AASX, clipboard, dictionary, delete, reference, and log APIs with the
   intended server-side authorization/session policy.

### P1 — Complete shared application capabilities

5. Finish search/replace/navigation and repository/registry adapters.
6. Make dictionary import attach real ConceptDescriptions and characterize the C#
   CDD/ECLASS mapping with fixtures.
7. Mount the plugin host and port the smallest deterministic plugins first:
   Contact Information, Digital Nameplate, Technical Data, Document Shelf, Generic
   Forms, and tabular export.
8. Finish selected-submodel JSON plus CSV/Excel/XML import/export and add
   cross-language round trips.

### P2 — File conversions and specialized tools

9. Port AML, BMEcat/CSV population, SAMM/RDF, Thing Description, JSON Schema,
   time-series import, semantic-ID replacement, UML/AsciiDoc, image maps, and PCN.

### P3 — Live protocols and high-risk systems

10. Port signing/encryption, AASX File Server SDK, OPC UA import/server/live refresh,
    MQTT events, editable scripts, Asset Interfaces, MTP, and live plotting with
    explicit security and integration-test plans.

## Definition of “100%” for future rows

A row should move to 100% only when its source acceptance behaviors are enumerated,
the live user/API path is proven, persistence or protocol effects are reopened and
verified, negative/error cases are tested, and C# or standards-authority outputs
are compared where semantics were translated. File counts, typecheck success, and
unit-test counts remain necessary gates, never parity scores.

