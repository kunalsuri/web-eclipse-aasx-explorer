/**
 * Find duplicate constraint IDs
 */

import { describe, it } from "vitest";
import { AllAASdConstraints } from "@shared/validation-rules/index";

describe("Find Duplicate IDs", () => {
  it("should list all duplicate IDs", () => {
    const ids = AllAASdConstraints.map((c) => c.id);
    const idCounts = new Map<string, number>();
    
    ids.forEach((id) => {
      idCounts.set(id, (idCounts.get(id) || 0) + 1);
    });
    
    const duplicates = Array.from(idCounts.entries())
      .filter(([id, count]) => count > 1)
      .map(([id, count]) => ({ id, count }));
    
    console.log("Duplicate IDs:", duplicates);
    console.log("\nAll IDs by category:");
    console.log("AASdConstraints:", AllAASdConstraints.filter(c => c.id.startsWith("AASd-0") && parseInt(c.id.split("-")[1]) < 100).map(c => c.id));
  });
});
