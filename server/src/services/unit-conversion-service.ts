/**
 * Unit Conversion Service
 * 
 * Provides unit conversion functionality for technical properties
 * Supports common engineering units (length, mass, temperature, pressure, etc.)
 */

// ============================================================================
// Types
// ============================================================================

export enum UnitCategory {
  Length = "length",
  Mass = "mass",
  Temperature = "temperature",
  Pressure = "pressure",
  Volume = "volume",
  Time = "time",
  Speed = "speed",
  Force = "force",
  Energy = "energy",
  Power = "power",
  Angle = "angle",
  Frequency = "frequency"
}

export interface Unit {
  symbol: string;
  name: string;
  category: UnitCategory;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export interface ConversionResult {
  value: number;
  unit: string;
  originalValue: number;
  originalUnit: string;
}

// ============================================================================
// Unit Definitions
// ============================================================================

const UNITS: Record<string, Unit> = {
  // Length
  "m": {
    symbol: "m",
    name: "meter",
    category: UnitCategory.Length,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "mm": {
    symbol: "mm",
    name: "millimeter",
    category: UnitCategory.Length,
    toBase: (v) => v / 1000,
    fromBase: (v) => v * 1000
  },
  "cm": {
    symbol: "cm",
    name: "centimeter",
    category: UnitCategory.Length,
    toBase: (v) => v / 100,
    fromBase: (v) => v * 100
  },
  "km": {
    symbol: "km",
    name: "kilometer",
    category: UnitCategory.Length,
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000
  },
  "in": {
    symbol: "in",
    name: "inch",
    category: UnitCategory.Length,
    toBase: (v) => v * 0.0254,
    fromBase: (v) => v / 0.0254
  },
  "ft": {
    symbol: "ft",
    name: "foot",
    category: UnitCategory.Length,
    toBase: (v) => v * 0.3048,
    fromBase: (v) => v / 0.3048
  },

  // Mass
  "kg": {
    symbol: "kg",
    name: "kilogram",
    category: UnitCategory.Mass,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "g": {
    symbol: "g",
    name: "gram",
    category: UnitCategory.Mass,
    toBase: (v) => v / 1000,
    fromBase: (v) => v * 1000
  },
  "mg": {
    symbol: "mg",
    name: "milligram",
    category: UnitCategory.Mass,
    toBase: (v) => v / 1000000,
    fromBase: (v) => v * 1000000
  },
  "t": {
    symbol: "t",
    name: "tonne",
    category: UnitCategory.Mass,
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000
  },
  "lb": {
    symbol: "lb",
    name: "pound",
    category: UnitCategory.Mass,
    toBase: (v) => v * 0.453592,
    fromBase: (v) => v / 0.453592
  },
  "oz": {
    symbol: "oz",
    name: "ounce",
    category: UnitCategory.Mass,
    toBase: (v) => v * 0.0283495,
    fromBase: (v) => v / 0.0283495
  },

  // Temperature
  "°C": {
    symbol: "°C",
    name: "Celsius",
    category: UnitCategory.Temperature,
    toBase: (v) => v + 273.15,
    fromBase: (v) => v - 273.15
  },
  "K": {
    symbol: "K",
    name: "Kelvin",
    category: UnitCategory.Temperature,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "°F": {
    symbol: "°F",
    name: "Fahrenheit",
    category: UnitCategory.Temperature,
    toBase: (v) => (v - 32) * 5/9 + 273.15,
    fromBase: (v) => (v - 273.15) * 9/5 + 32
  },

  // Pressure
  "Pa": {
    symbol: "Pa",
    name: "Pascal",
    category: UnitCategory.Pressure,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "kPa": {
    symbol: "kPa",
    name: "kilopascal",
    category: UnitCategory.Pressure,
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000
  },
  "MPa": {
    symbol: "MPa",
    name: "megapascal",
    category: UnitCategory.Pressure,
    toBase: (v) => v * 1000000,
    fromBase: (v) => v / 1000000
  },
  "bar": {
    symbol: "bar",
    name: "bar",
    category: UnitCategory.Pressure,
    toBase: (v) => v * 100000,
    fromBase: (v) => v / 100000
  },
  "psi": {
    symbol: "psi",
    name: "pound per square inch",
    category: UnitCategory.Pressure,
    toBase: (v) => v * 6894.76,
    fromBase: (v) => v / 6894.76
  },

  // Volume
  "m³": {
    symbol: "m³",
    name: "cubic meter",
    category: UnitCategory.Volume,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "L": {
    symbol: "L",
    name: "liter",
    category: UnitCategory.Volume,
    toBase: (v) => v / 1000,
    fromBase: (v) => v * 1000
  },
  "mL": {
    symbol: "mL",
    name: "milliliter",
    category: UnitCategory.Volume,
    toBase: (v) => v / 1000000,
    fromBase: (v) => v * 1000000
  },
  "gal": {
    symbol: "gal",
    name: "gallon",
    category: UnitCategory.Volume,
    toBase: (v) => v * 0.00378541,
    fromBase: (v) => v / 0.00378541
  },

  // Time
  "s": {
    symbol: "s",
    name: "second",
    category: UnitCategory.Time,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "ms": {
    symbol: "ms",
    name: "millisecond",
    category: UnitCategory.Time,
    toBase: (v) => v / 1000,
    fromBase: (v) => v * 1000
  },
  "min": {
    symbol: "min",
    name: "minute",
    category: UnitCategory.Time,
    toBase: (v) => v * 60,
    fromBase: (v) => v / 60
  },
  "h": {
    symbol: "h",
    name: "hour",
    category: UnitCategory.Time,
    toBase: (v) => v * 3600,
    fromBase: (v) => v / 3600
  },

  // Speed
  "m/s": {
    symbol: "m/s",
    name: "meter per second",
    category: UnitCategory.Speed,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "km/h": {
    symbol: "km/h",
    name: "kilometer per hour",
    category: UnitCategory.Speed,
    toBase: (v) => v / 3.6,
    fromBase: (v) => v * 3.6
  },
  "mph": {
    symbol: "mph",
    name: "mile per hour",
    category: UnitCategory.Speed,
    toBase: (v) => v * 0.44704,
    fromBase: (v) => v / 0.44704
  },

  // Force
  "N": {
    symbol: "N",
    name: "Newton",
    category: UnitCategory.Force,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "kN": {
    symbol: "kN",
    name: "kilonewton",
    category: UnitCategory.Force,
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000
  },
  "lbf": {
    symbol: "lbf",
    name: "pound-force",
    category: UnitCategory.Force,
    toBase: (v) => v * 4.44822,
    fromBase: (v) => v / 4.44822
  },

  // Energy
  "J": {
    symbol: "J",
    name: "Joule",
    category: UnitCategory.Energy,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "kJ": {
    symbol: "kJ",
    name: "kilojoule",
    category: UnitCategory.Energy,
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000
  },
  "Wh": {
    symbol: "Wh",
    name: "watt-hour",
    category: UnitCategory.Energy,
    toBase: (v) => v * 3600,
    fromBase: (v) => v / 3600
  },
  "kWh": {
    symbol: "kWh",
    name: "kilowatt-hour",
    category: UnitCategory.Energy,
    toBase: (v) => v * 3600000,
    fromBase: (v) => v / 3600000
  },

  // Power
  "W": {
    symbol: "W",
    name: "Watt",
    category: UnitCategory.Power,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "kW": {
    symbol: "kW",
    name: "kilowatt",
    category: UnitCategory.Power,
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000
  },
  "MW": {
    symbol: "MW",
    name: "megawatt",
    category: UnitCategory.Power,
    toBase: (v) => v * 1000000,
    fromBase: (v) => v / 1000000
  },
  "hp": {
    symbol: "hp",
    name: "horsepower",
    category: UnitCategory.Power,
    toBase: (v) => v * 745.7,
    fromBase: (v) => v / 745.7
  },

  // Angle
  "rad": {
    symbol: "rad",
    name: "radian",
    category: UnitCategory.Angle,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "deg": {
    symbol: "deg",
    name: "degree",
    category: UnitCategory.Angle,
    toBase: (v) => v * Math.PI / 180,
    fromBase: (v) => v * 180 / Math.PI
  },

  // Frequency
  "Hz": {
    symbol: "Hz",
    name: "Hertz",
    category: UnitCategory.Frequency,
    toBase: (v) => v,
    fromBase: (v) => v
  },
  "kHz": {
    symbol: "kHz",
    name: "kilohertz",
    category: UnitCategory.Frequency,
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000
  },
  "MHz": {
    symbol: "MHz",
    name: "megahertz",
    category: UnitCategory.Frequency,
    toBase: (v) => v * 1000000,
    fromBase: (v) => v / 1000000
  }
};

// ============================================================================
// Unit Conversion Service
// ============================================================================

export class UnitConversionService {
  /**
   * Convert a value from one unit to another
   */
  convert(value: number, fromUnit: string, toUnit: string): ConversionResult | null {
    const from = UNITS[fromUnit];
    const to = UNITS[toUnit];

    if (!from || !to) {
      return null;
    }

    // Check if units are in the same category
    if (from.category !== to.category) {
      return null;
    }

    // Convert to base unit, then to target unit
    const baseValue = from.toBase(value);
    const convertedValue = to.fromBase(baseValue);

    return {
      value: convertedValue,
      unit: toUnit,
      originalValue: value,
      originalUnit: fromUnit
    };
  }

  /**
   * Get all units for a category
   */
  getUnitsForCategory(category: UnitCategory): Unit[] {
    return Object.values(UNITS).filter(unit => unit.category === category);
  }

  /**
   * Get unit category
   */
  getUnitCategory(unitSymbol: string): UnitCategory | null {
    const unit = UNITS[unitSymbol];
    return unit ? unit.category : null;
  }

  /**
   * Check if a unit is supported
   */
  isUnitSupported(unitSymbol: string): boolean {
    return unitSymbol in UNITS;
  }

  /**
   * Get compatible units for a given unit
   */
  getCompatibleUnits(unitSymbol: string): Unit[] {
    const unit = UNITS[unitSymbol];
    if (!unit) {
      return [];
    }

    return this.getUnitsForCategory(unit.category);
  }

  /**
   * Get all supported units
   */
  getAllUnits(): Unit[] {
    return Object.values(UNITS);
  }

  /**
   * Get all categories
   */
  getAllCategories(): UnitCategory[] {
    return Object.values(UnitCategory);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: UnitConversionService | null = null;

/**
 * Get the singleton unit conversion service instance
 */
export function getUnitConversionService(): UnitConversionService {
  serviceInstance ??= new UnitConversionService();
  return serviceInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetUnitConversionService(): void {
  serviceInstance = null;
}
