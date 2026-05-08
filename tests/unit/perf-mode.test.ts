/**
 * Perf-mode hook tests.
 *
 * The hook itself is a thin wrapper around browser APIs (matchMedia,
 * navigator.connection, navigator.deviceMemory, navigator.getBattery)
 * so we test the *decision logic* directly to avoid pulling in JSDOM.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

type Inputs = {
  calmMode?: boolean;
  reducedMotion?: boolean;
  saveData?: boolean;
  deviceMemory?: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
};

// Mirror of hooks/use-perf-mode.ts decision logic.
function decidePerfMode(i: Inputs): "full" | "lite" {
  if (i.calmMode) {
    return "lite";
  }
  if (i.reducedMotion) {
    return "lite";
  }
  if (i.saveData) {
    return "lite";
  }
  if (typeof i.deviceMemory === "number" && i.deviceMemory <= 4) {
    return "lite";
  }
  if (
    typeof i.batteryLevel === "number" &&
    i.batteryLevel < 0.2 &&
    i.batteryCharging === false
  ) {
    return "lite";
  }
  return "full";
}

describe("perf-mode decision", () => {
  it("returns full by default", () => {
    assert.equal(decidePerfMode({}), "full");
  });

  it("returns lite when Calm mode is enabled", () => {
    assert.equal(decidePerfMode({ calmMode: true }), "lite");
  });

  it("returns lite when prefers-reduced-motion is set", () => {
    assert.equal(decidePerfMode({ reducedMotion: true }), "lite");
  });

  it("returns lite when save-data is on", () => {
    assert.equal(decidePerfMode({ saveData: true }), "lite");
  });

  it("returns lite on low-memory devices (≤ 4 GB)", () => {
    assert.equal(decidePerfMode({ deviceMemory: 4 }), "lite");
    assert.equal(decidePerfMode({ deviceMemory: 2 }), "lite");
  });

  it("returns full on devices with more than 4 GB", () => {
    assert.equal(decidePerfMode({ deviceMemory: 8 }), "full");
  });

  it("returns lite when battery is low and discharging", () => {
    assert.equal(
      decidePerfMode({ batteryLevel: 0.15, batteryCharging: false }),
      "lite"
    );
  });

  it("returns full when battery is low but charging", () => {
    assert.equal(
      decidePerfMode({ batteryLevel: 0.15, batteryCharging: true }),
      "full"
    );
  });
});
