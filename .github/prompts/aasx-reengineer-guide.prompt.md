# **Master Prompt — Re-Engineering Eclipse AASX Package Explorer into Eclipse AASX Web**

---

## **Role**

Act as a **Coding LLM** with the role of an **expert full-stack engineer and architect**.
You are tasked with **re-engineering** the **Eclipse AASX Package Explorer** (C# / .NET) into a **modern, modular, feature-driven SaaS web application** named **Eclipse AASX Web**.

The new system must be clean, extensible, and serve as a **base template for future features** — implemented entirely in **TypeScript**, using **React (frontend)** and **Express (backend)**.

---

### **Repository & Domain Context**

- **Source Repository:** /x-external-proj
- **Technology:** C#, .NET, Windows Desktop (uses DLLs, WPF, OPC UA, REST server)
- **Domain:** Asset Administration Shell (AAS) according to **AAS V3 specifications**
- **Goal:** Feature-parity SaaS version that can run cross-platform (browser + Node.js backend)

---

### **Core Tasks**

1. **Repository Analysis**

   - Understand the architecture, entry points, namespaces, and module structure.
   - Identify DLL dependencies and system calls that require re-implementation for the web.

2. **Feature Catalog Creation**

   - Enumerate every significant feature from the C# codebase (UI tools, package editor, AAS model handling, REST/OPC UA services, validation, serialization, etc.).
   - For each feature, describe:

     - Functional purpose
     - Input / output
     - Dependencies
     - UI interactions
     - Relation to AAS V3 specification

3. **Task Generation & Conversion Plan**

   - For each cataloged feature, define **conversion tasks** that migrate functionality from C# to TypeScript.
   - Include mappings:

     - C# class → TypeScript module
     - Windows APIs → Web APIs or Node.js equivalents
     - Desktop UI → Web UI components

   - Where a direct equivalent is missing, propose a creative, modern web alternative that achieves the same goal.

4. **AAS V3 Compliance**

   - Ensure the SaaS version adheres strictly to **Asset Administration Shell V3** specifications.
   - If information is incomplete, perform a **web search** for current AAS V3 references and apply compliance rules in data models, serialization, and validation.
   - Provide TypeScript type definitions that mirror AAS V3 schemas.

5. **Testing & Validation**

   - Create Jest / Vitest unit tests for each module.
   - Add integration tests that confirm functional parity with the original C# tool (open / edit / save / validate AASX).

6. **Creativity & Autonomy**

   - If any C# feature or Windows-specific API lacks a direct web equivalent, **be creative** and propose an equivalent design or library.
   - When stuck, **search the web** for current best practices or AAS V3 details.
   - Deliver **100 % functional, production-ready code** that can be built, tested, and deployed as a SaaS application.

---

## **Core Web Applicaiton Setup Availabe in Repo**

- **Stack:** React (TypeScript) + Express (TypeScript)
- **Styling/UI:** TailwindCSS + [shadcn/ui](https://ui.shadcn.com/) + Lucide Icons
- **Fonts:** Inter / SF Pro Display
- **Design Language:** Card-based UI, responsive grid, 16 px base spacing, smooth theme transitions, simolar to modern GitHub and Vercel applications.
- **Architecture Type:** Feature-driven `/client` + `/server` structure

---

## **Current Project Structure**

```
CEA-WEB-AASX-PACKAGE-EXPLORER/
├── client/                          # React + TypeScript frontend
│   └── src/
│       ├── features/                # Feature-based modules
│       │   ├── user-profile/        # Example feature
│       │   │   ├── components/      # Feature-specific components
│       │   │   ├── hooks/           # Feature-specific hooks
│       │   │   ├── services/        # Feature-level API or utils
│       │   │   └── index.ts         # Feature entry point
│       │   ├── aasx-editor/         # AASX viewer/editor feature
│       │   ├── file-manager/        # File I/O and package handling
│       │   └── auth/                # Auth + session handling
│       ├── components/              # Shared UI components (cards, modals, inputs)
│       ├── hooks/                   # Global hooks (theme, storage)
│       ├── lib/                     # Shared libs, utils
│       ├── routes/                  # Route definitions
│       ├── App.tsx
│       └── main.tsx
│
├── server/                          # Express + TypeScript backend
│   ├── src/
│   │   ├── api/                     # REST routes
│   │   │   ├── aasx/                # Endpoints for .aasx operations
│   │   │   ├── files/               # File management routes
│   │   │   ├── users/               # Auth/user endpoints
│   │   │   └── index.ts
│   │   ├── services/                # Business logic (AAS, serialization)
│   │   ├── utils/                   # Shared utilities
│   │   ├── middleware/              # Auth, logging, validation
│   │   ├── types/                   # Shared TS types/interfaces
│   │   └── server.ts
│
├── data/                            # File-based persistence
│   ├── tenants/
│   ├── aasx/
│   ├── users/
│   └── logs/
│
├── docs/
├── package.json
└── tsconfig.json
```

---

## **Persistence Model**

- **No database.**
  All state, metadata, and user data are stored as **JSON files** within `/data/`.
- Each feature module defines its own schema and uses async FS operations for reads/writes.
- Use **atomic save** (temp-file rename) for reliability.
- Directory conventions:

  ```
  /data/
    ├── aasx/<file-id>.json
    ├── users.json
    └── aasx-logs/activity.log
  ```

---

## **System Architecture**

- **Backend:** TypeScript + Express

  - REST API (JSON)
  - Middleware for auth/logging/error handling
  - File-based persistence

- **Frontend:** React + TypeScript

  - Feature-based modular structure
  - shadcn/ui components + Tailwind for design
  - Axios/Fetch for REST calls

- **Auth:** JWT/session tokens stored in `/data/users/`

---

## **Development Workflow**

1. **Repository Analysis:** Summarize original C# namespaces, classes, and logic.
2. **Mapping Plan:** Create `mapping.json` linking C# files → TS equivalents.
3. **Architecture Proposal:** Adapt layout to `/client` and `/server` structure.
4. **Domain Implementation:** Recreate AAS models, parsing, serialization.
5. **Feature Modules:** Build viewer/editor, file-manager, and auth features.
6. **Persistence Implementation:** JSON-based file operations in `/data/`.

---
