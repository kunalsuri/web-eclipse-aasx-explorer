# Directive – Phase Continuation (Full Autonomous Mode, Minimal User Feedback)

Proceed with all project tasks in clearly defined phases, operating fully autonomously while maintaining strict documentation and structure. For each phase, create a dedicated folder under .kiro/specs/<project-name>/<Phase_Name>, and within it, generate the three files: requirements.md outlining the phase objectives and constraints, design.md detailing the technical and architectural approach, and tasks.md listing the actionable steps and execution plan. Additionally, create a tests subfolder inside each Phase directory to store test cases, evaluation criteria, and validation results for every task. This structure must be consistently followed to ensure clarity, traceability, and seamless collaboration between AI agents throughout the entire project lifecycle.

---
## 0 Prerequisites Codebase Preservation

### **No code duplication** 
- You must operate with full awareness of the actual C# code located in /x-external-proj.

### No Assumptions. No Hallucinations. 
- Do not invent code, logic, or functionality that is not explicitly present in the repository.

### Code Fidelity Required:
- All requirements, designs, and generated code must be strictly based on the real implementation found in /x-external-proj.

### When in Doubt — Ask Me.
- If any part of the codebase, requirement, or intention is unclear, you must pause and ask for clarification before proceeding.

### Absolutely No Fabrication:
- Do not generate placeholders, pseudo-logic, or imagined APIs. Use only what is verifiable from the actual source files.


---

## 1 Context Preservation

- Maintain uninterrupted architectural, functional, and domain context.  
- **No loss, drift, or reinterpretation** of existing context.

---

## 2 Technical Standards Compliance

- **React & TypeScript**: Enforce strict compliance with all development principles and best practices.
- **AAS Modeling (Asset Administration Shell)**: Implement features strictly based on the AAS feature catalog obtained from the external project.
- All code must align with:
  - Component architecture patterns  
  - Typing conventions  
  - Semantic modeling rules

---

## 3 Evaluation-Driven Development

- Apply **evaluation-driven development** for all feature work.
- Each feature **must be fully tested**:
  - Functional logic  
  - Integration paths  
  - Edge cases and failure modes

---

## 4 Documentation & Prompt Adherence

- Follow all specifications and constraints defined in prompt and configuration files:
  - `copilot-instructions.md`
- **No assumptions** beyond the documented scope are permitted.

---

**Non-compliance with any directive requires self-correction before advancement.**