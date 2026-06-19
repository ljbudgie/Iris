import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isEqualityActContext,
  selectRelevantCaseLaw,
  EQUALITY_ACT_TRIGGERS,
  EQUALITY_ACT_TRIGGER_RE,
  EQUALITY_ACT_SECTIONS,
  EQUALITY_ACT_CASE_LAW,
  EQUALITY_ACT_HUMAN_LENS,
  EQUALITY_ACT_NULL_CONSEQUENCE,
  EQUALITY_ACT_STANDARD_PARAGRAPH,
  EQUALITY_ACT_PROTOCOL_BLOCK,
} from "../../lib/ai/equality-act-protocol";

// ---------------------------------------------------------------------------
// isEqualityActContext — trigger detection
// ---------------------------------------------------------------------------

describe("isEqualityActContext — positive triggers", () => {
  it("matches 'deaf'", () => {
    assert.equal(isEqualityActContext("I am deaf and need email-only contact"), true);
  });

  it("matches 'autism' (case-insensitive)", () => {
    assert.equal(isEqualityActContext("My son has Autism"), true);
  });

  it("matches 'reasonable adjustment'", () => {
    assert.equal(isEqualityActContext("They refused my reasonable adjustment"), true);
  });

  it("matches 'disability' as a standalone word", () => {
    assert.equal(isEqualityActContext("disability discrimination"), true);
  });

  it("matches 'psed'", () => {
    assert.equal(isEqualityActContext("PSED obligations ignored"), true);
  });

  it("matches 'anticipatory duty'", () => {
    assert.equal(isEqualityActContext("anticipatory duty not followed"), true);
  });

  it("matches 'email-only'", () => {
    assert.equal(isEqualityActContext("I requested email-only contact"), true);
  });

  it("matches 'neurodivergent'", () => {
    assert.equal(isEqualityActContext("I'm neurodivergent and find phone calls difficult"), true);
  });
});

describe("isEqualityActContext — no false positives", () => {
  it("does not match an unrelated banking query", () => {
    assert.equal(isEqualityActContext("My direct debit was taken twice"), false);
  });

  it("does not match a plain FOI request", () => {
    assert.equal(isEqualityActContext("Can I make a freedom of information request?"), false);
  });

  it("does not match empty string", () => {
    assert.equal(isEqualityActContext(""), false);
  });
});

// ---------------------------------------------------------------------------
// Trigger list integrity
// ---------------------------------------------------------------------------

describe("EQUALITY_ACT_TRIGGERS — content", () => {
  it("includes core sections as triggers", () => {
    const triggers = EQUALITY_ACT_TRIGGERS as readonly string[];
    assert.ok(triggers.includes("section 149"), "missing section 149");
    assert.ok(triggers.includes("section 20"), "missing section 20");
    assert.ok(triggers.includes("section 21"), "missing section 21");
  });

  it("includes hidden disability types", () => {
    const triggers = EQUALITY_ACT_TRIGGERS as readonly string[];
    assert.ok(triggers.includes("fibromyalgia"), "missing fibromyalgia");
    assert.ok(triggers.includes("adhd"), "missing adhd");
  });

  it("EQUALITY_ACT_TRIGGER_RE is case-insensitive", () => {
    assert.ok(EQUALITY_ACT_TRIGGER_RE.flags.includes("i"));
  });
});

// ---------------------------------------------------------------------------
// EQUALITY_ACT_SECTIONS — statutory toolkit completeness
// ---------------------------------------------------------------------------

describe("EQUALITY_ACT_SECTIONS — completeness", () => {
  it("covers all seven required protections", () => {
    assert.ok("s6_definition" in EQUALITY_ACT_SECTIONS, "missing s.6");
    assert.ok("s19_indirect" in EQUALITY_ACT_SECTIONS, "missing s.19");
    assert.ok("s20_21_duty" in EQUALITY_ACT_SECTIONS, "missing ss.20–21");
    assert.ok("s27_victimisation" in EQUALITY_ACT_SECTIONS, "missing s.27");
    assert.ok("s29_services" in EQUALITY_ACT_SECTIONS, "missing s.29");
    assert.ok("schedule2_anticipatory" in EQUALITY_ACT_SECTIONS, "missing Schedule 2");
    assert.ok("s149_psed" in EQUALITY_ACT_SECTIONS, "missing s.149");
  });

  it("s149 summary mentions individual consideration", () => {
    assert.match(
      EQUALITY_ACT_SECTIONS.s149_psed.summary,
      /individual/i,
      "s.149 should reference individual consideration, not blanket process"
    );
  });

  it("s6 summary confirms no diagnosis required", () => {
    assert.match(
      EQUALITY_ACT_SECTIONS.s6_definition.summary,
      /diagnosis/i
    );
  });
});

// ---------------------------------------------------------------------------
// EQUALITY_ACT_CASE_LAW — three cases present
// ---------------------------------------------------------------------------

describe("EQUALITY_ACT_CASE_LAW — required cases", () => {
  const citations = EQUALITY_ACT_CASE_LAW.map((c) => c.cite);

  it("includes ZH v Commissioner of Police", () => {
    assert.ok(
      citations.some((c) => c.includes("ZH")),
      "missing ZH v Commissioner of Police"
    );
  });

  it("includes FirstGroup v Paulley", () => {
    assert.ok(
      citations.some((c) => c.includes("FirstGroup")),
      "missing FirstGroup v Paulley"
    );
  });

  it("includes RBS v Allen", () => {
    assert.ok(
      citations.some((c) => c.includes("Allen")),
      "missing RBS v Allen"
    );
  });
});

// ---------------------------------------------------------------------------
// selectRelevantCaseLaw — context-based filtering
// ---------------------------------------------------------------------------

describe("selectRelevantCaseLaw — filtering", () => {
  it("returns ZH for police/autism context", () => {
    const results = selectRelevantCaseLaw("police dealing with autism");
    assert.ok(
      results.some((c) => c.cite.includes("ZH")),
      "expected ZH to be returned for police/autism context"
    );
  });

  it("returns FirstGroup for anticipatory duty context", () => {
    const results = selectRelevantCaseLaw("anticipatory duty service provider");
    assert.ok(
      results.some((c) => c.cite.includes("FirstGroup")),
      "expected FirstGroup to be returned for anticipatory duty context"
    );
  });

  it("returns empty array for unrelated context", () => {
    const results = selectRelevantCaseLaw("planning permission garden wall");
    assert.equal(results.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Key constants — content checks
// ---------------------------------------------------------------------------

describe("EQUALITY_ACT_HUMAN_LENS", () => {
  it("asks about named human review of disability and adjustment", () => {
    assert.match(EQUALITY_ACT_HUMAN_LENS, /named human/i);
    assert.match(EQUALITY_ACT_HUMAN_LENS, /disability/i);
    assert.match(EQUALITY_ACT_HUMAN_LENS, /adjustment/i);
  });
});

describe("EQUALITY_ACT_NULL_CONSEQUENCE", () => {
  it("references both the Burgess Principle and the Equality Act", () => {
    assert.match(EQUALITY_ACT_NULL_CONSEQUENCE, /Burgess Principle/i);
    assert.match(EQUALITY_ACT_NULL_CONSEQUENCE, /Equality Act/i);
  });

  it("mentions Schedule 2 anticipatory duty", () => {
    assert.match(EQUALITY_ACT_NULL_CONSEQUENCE, /Schedule 2/i);
  });
});

describe("EQUALITY_ACT_STANDARD_PARAGRAPH", () => {
  it("references ss.20, 21 and 29", () => {
    assert.match(EQUALITY_ACT_STANDARD_PARAGRAPH, /20/);
    assert.match(EQUALITY_ACT_STANDARD_PARAGRAPH, /21/);
    assert.match(EQUALITY_ACT_STANDARD_PARAGRAPH, /29/);
  });

  it("references Schedule 2", () => {
    assert.match(EQUALITY_ACT_STANDARD_PARAGRAPH, /Schedule 2/i);
  });

  it("references s.149 PSED", () => {
    assert.match(EQUALITY_ACT_STANDARD_PARAGRAPH, /149/);
  });

  it("requests named human confirmation", () => {
    assert.match(EQUALITY_ACT_STANDARD_PARAGRAPH, /named person/i);
  });
});

describe("EQUALITY_ACT_PROTOCOL_BLOCK", () => {
  it("contains the Human Lens question", () => {
    assert.ok(
      EQUALITY_ACT_PROTOCOL_BLOCK.includes(EQUALITY_ACT_HUMAN_LENS),
      "protocol block must include the Human Lens question verbatim"
    );
  });

  it("contains the standard paragraph", () => {
    assert.ok(
      EQUALITY_ACT_PROTOCOL_BLOCK.includes(EQUALITY_ACT_STANDARD_PARAGRAPH),
      "protocol block must include the standard paragraph verbatim"
    );
  });

  it("references all three case law anchors", () => {
    assert.match(EQUALITY_ACT_PROTOCOL_BLOCK, /ZH/);
    assert.match(EQUALITY_ACT_PROTOCOL_BLOCK, /FirstGroup/);
    assert.match(EQUALITY_ACT_PROTOCOL_BLOCK, /Allen/);
  });
});
