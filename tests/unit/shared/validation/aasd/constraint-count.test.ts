/**
 * Test to verify constraint count
 */

import { describe, it, expect } from "vitest";
import { 
  AllAASdConstraints, 
  AASdConstraints,
  AASdAdvancedConstraints,
  AASdStructuralConstraints,
  AASdSemanticConstraints,
  AASdReferenceConstraints,
} from "@shared/validation-rules/index";

describe("Constraint Count Verification", () => {
  it("should have correct number of constraints per category", () => {
    console.log("AASdConstraints:", AASdConstraints.length);
    console.log("AASdAdvancedConstraints:", AASdAdvancedConstraints.length);
    console.log("AASdStructuralConstraints:", AASdStructuralConstraints.length);
    console.log("AASdSemanticConstraints:", AASdSemanticConstraints.length);
    console.log("AASdReferenceConstraints:", AASdReferenceConstraints.length);
    console.log("Total AllAASdConstraints:", AllAASdConstraints.length);

    // Verify reference constraints
    expect(AASdReferenceConstraints.length).toBe(25);
    
    // Verify total
    const expectedTotal = 
      AASdConstraints.length +
      AASdAdvancedConstraints.length +
      AASdStructuralConstraints.length +
      AASdSemanticConstraints.length +
      AASdReferenceConstraints.length;
    
    // Updated to include 12 data type constraints (AASd-132 to AASd-143)
    // and 7 cardinality constraints (AASd-144 to AASd-150)
    expect(AllAASdConstraints.length).toBe(expectedTotal + 12 + 7);
  });

  it("should have unique constraint IDs", () => {
    const ids = AllAASdConstraints.map((c) => c.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("should have all reference constraints with correct IDs", () => {
    const referenceIds = AASdReferenceConstraints.map((c) => c.id);
    
    const expectedIds = [
      "AASd-098", "AASd-099", "AASd-100", "AASd-101", "AASd-102",
      "AASd-103", "AASd-104", "AASd-105", "AASd-106", "AASd-108",
      "AASd-109", "AASd-110", "AASd-111", "AASd-112", "AASd-113",
      "AASd-115", "AASd-117", "AASd-122", "AASd-123", "AASd-124",
      "AASd-125", "AASd-126", "AASd-127", "AASd-128", "AASd-129",
    ];
    
    expect(referenceIds).toEqual(expectedIds);
  });

  it("should have all reference constraints with category 'reference'", () => {
    const allReference = AASdReferenceConstraints.every((c) => c.category === "reference");
    expect(allReference).toBe(true);
  });
});
