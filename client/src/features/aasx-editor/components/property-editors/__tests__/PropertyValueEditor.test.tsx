/**
 * Tests for PropertyValueEditor
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropertyValueEditor } from "../PropertyValueEditor";
import { DataTypeDefXsd, AasSubmodelElements } from "@/../../shared/aas-v3-types";

describe("PropertyValueEditor", () => {
  const mockProperty = {
    idShort: "TestProperty",
    modelType: AasSubmodelElements.Property,
    valueType: DataTypeDefXsd.String,
    value: "test value",
  } as any;

  it("should render with initial value", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <PropertyValueEditor
        property={mockProperty}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(screen.getByDisplayValue("test value")).toBeInTheDocument();
  });

  it("should validate boolean values", () => {
    const boolProperty = {
      ...mockProperty,
      valueType: DataTypeDefXsd.Boolean,
      value: "invalid",
    } as any;

    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <PropertyValueEditor
        property={boolProperty}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    // Should show validation error for invalid boolean
    expect(screen.getByText(/Boolean must be/i)).toBeInTheDocument();
  });

  it("should validate integer values", () => {
    const intProperty = {
      ...mockProperty,
      valueType: DataTypeDefXsd.Integer,
      value: "123.45",
    } as any;

    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <PropertyValueEditor
        property={intProperty}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    // Should show validation error for non-integer
    expect(screen.getByText(/must be an integer/i)).toBeInTheDocument();
  });

  it("should call onSave with updated property", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <PropertyValueEditor
        property={mockProperty}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    const input = screen.getByDisplayValue("test value");
    fireEvent.change(input, { target: { value: "new value" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "new value",
      })
    );
  });

  it("should call onCancel when cancel button clicked", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <PropertyValueEditor
        property={mockProperty}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it("should be read-only when readOnly prop is true", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <PropertyValueEditor
        property={mockProperty}
        onSave={onSave}
        onCancel={onCancel}
        readOnly={true}
      />
    );

    const input = screen.getByDisplayValue("test value");
    expect(input).toBeDisabled();

    // Save and cancel buttons should not be present
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });
});
