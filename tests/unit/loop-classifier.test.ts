/**
 * Tests for the local-first institutional delay pattern classifier.
 *
 * Mirrors burgess-principle tests/test_loop_classifier.py — validation,
 * each of the six detectors, and the SOVEREIGN/NULL accountability signal.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyThread, sequenceMatcherRatio } from "../../lib/loop";
import type { LoopMessageInput, LoopType } from "../../lib/loop";

function message(
  date: string,
  sender: string,
  content_summary: string,
  direction: "institution" | "individual",
  reference: string
): LoopMessageInput {
  return { date, sender, content_summary, direction, reference };
}

describe("sequenceMatcherRatio", () => {
  it("returns 1 for identical strings", () => {
    assert.equal(sequenceMatcherRatio("abc", "abc"), 1);
  });

  it("returns 1 for two empty strings", () => {
    assert.equal(sequenceMatcherRatio("", ""), 1);
  });

  it("returns a high ratio for near-identical strings", () => {
    const ratio = sequenceMatcherRatio(
      "all points have been addressed",
      "all points have been addressed."
    );
    assert.ok(ratio >= 0.88, `expected ratio >= 0.88, got ${ratio}`);
  });

  it("returns a low ratio for unrelated strings", () => {
    const ratio = sequenceMatcherRatio("abc", "xyz");
    assert.equal(ratio, 0);
  });
});

describe("classifyThread validation", () => {
  it("rejects an empty messages array", () => {
    assert.throws(() => classifyThread({ messages: [] }), /non-empty array/);
  });

  it("rejects more than 500 messages", () => {
    const messages = Array.from({ length: 501 }, (_, index) =>
      message(
        "2026-08-01",
        "Institution",
        `msg ${index}`,
        "institution",
        String(index)
      )
    );
    assert.throws(() => classifyThread({ messages }), /at most 500 items/);
  });

  it("rejects an invalid message shape", () => {
    assert.throws(
      () =>
        classifyThread({
          messages: [
            { date: "", sender: "Institution", content_summary: "text" },
          ] as LoopMessageInput[],
        }),
      /non-empty date/
    );
  });

  it("rejects a date that is not ISO-8601", () => {
    assert.throws(
      () =>
        classifyThread({
          messages: [
            message(
              "not-a-date",
              "Institution",
              "Acknowledge receipt.",
              "institution",
              "A"
            ),
          ],
        }),
      /ISO-8601 date/
    );
  });

  it("rejects content_summary longer than 20000 characters", () => {
    assert.throws(
      () =>
        classifyThread({
          messages: [
            message(
              "2026-08-01",
              "Institution",
              "x".repeat(20_001),
              "institution",
              "A"
            ),
          ],
        }),
      /too long/
    );
  });

  it("rejects a non-string institution", () => {
    assert.throws(
      () =>
        classifyThread({
          institution: 42 as unknown as string,
          messages: [
            message(
              "2026-08-01",
              "Institution",
              "Acknowledge receipt.",
              "institution",
              "A"
            ),
          ],
        }),
      /institution must be a string/
    );
  });

  it("rejects a non-string named_individual", () => {
    assert.throws(
      () =>
        classifyThread({
          named_individual: 42 as unknown as string,
          messages: [
            message(
              "2026-08-01",
              "Institution",
              "Acknowledge receipt.",
              "institution",
              "A"
            ),
          ],
        }),
      /named_individual must be a string/
    );
  });
});

describe("classifyThread detectors", () => {
  const cases: Array<{ messages: LoopMessageInput[]; loopType: LoopType }> = [
    {
      messages: [
        message(
          "2026-08-01",
          "Council",
          "Your answer is not sufficient; provide more information.",
          "institution",
          "A"
        ),
        message(
          "2026-08-03",
          "Individual",
          "I have supplied the requested information.",
          "individual",
          "B"
        ),
        message(
          "2026-08-06",
          "Council",
          "This is still not sufficient. Please provide further information.",
          "institution",
          "C"
        ),
      ],
      loopType: "insufficiency",
    },
    {
      messages: [
        message(
          "2026-08-01",
          "EHRC",
          "Please contact EASS.",
          "institution",
          "A"
        ),
        message(
          "2026-08-02",
          "EASS",
          "Please contact EHRC.",
          "institution",
          "B"
        ),
        message(
          "2026-08-03",
          "EHRC",
          "Please contact EASS.",
          "institution",
          "C"
        ),
      ],
      loopType: "circular_referral",
    },
    {
      messages: [
        message(
          "2026-08-01",
          "Council",
          "We cannot assess relief until the review is complete.",
          "institution",
          "A"
        ),
      ],
      loopType: "precondition_stacking",
    },
    {
      messages: [
        message(
          "2026-08-01",
          "Commission",
          "All points have been addressed.",
          "institution",
          "A"
        ),
        message(
          "2026-08-02",
          "Commission",
          "All points have been addressed.",
          "institution",
          "B"
        ),
      ],
      loopType: "template_dismissal",
    },
    {
      messages: [
        message(
          "2026-08-01",
          "Individual",
          "I have provided identity documents.",
          "individual",
          "A"
        ),
        message(
          "2026-08-02",
          "Experian",
          "Verify your identity before we engage with this dispute.",
          "institution",
          "B"
        ),
      ],
      loopType: "identity_loop",
    },
    {
      messages: [
        message(
          "2026-08-01",
          "Individual",
          "My established adjustment is email-only; do not call.",
          "individual",
          "A"
        ),
        message(
          "2026-08-02",
          "Institution",
          "Please call us to discuss this.",
          "institution",
          "B"
        ),
      ],
      loopType: "channel_redirect",
    },
  ];

  for (const { messages, loopType } of cases) {
    it(`classifies ${loopType}`, () => {
      const finding = classifyThread({
        institution: "Example Institution",
        messages,
      });

      assert.equal(finding.loop_detected, true);
      assert.equal(finding.loop_type, loopType);
      assert.ok(finding.loop_count >= 1);
      assert.equal(finding.accountability_finding, "NULL");
      assert.equal(finding.requires_human_confirmation, true);
      assert.equal(finding.provisional, true);
      assert.equal(finding.schema_version, 1);
    });
  }

  it("returns NO LOOP with zero elapsed days and null type when no pattern is detected", () => {
    const finding = classifyThread({
      institution: "Example Institution",
      messages: [
        message(
          "2026-08-01",
          "Institution",
          "We have received your message.",
          "institution",
          "A"
        ),
      ],
    });

    assert.equal(finding.loop_detected, false);
    assert.equal(finding.loop_type, null);
    assert.equal(finding.loop_count, 0);
    assert.equal(finding.days_consumed, 0);
    assert.ok(finding.summary.startsWith("NO LOOP"));
  });

  it("does not treat a single identity request as an identity loop", () => {
    const finding = classifyThread({
      messages: [
        message(
          "2026-08-01",
          "Institution",
          "Verify your identity before we engage.",
          "institution",
          "A"
        ),
      ],
    });

    assert.equal(finding.loop_detected, false);
  });
});

describe("classifyThread accountability finding", () => {
  it("is SOVEREIGN when a named_individual is a non-empty string", () => {
    const finding = classifyThread({
      institution: "Example Institution",
      named_individual: "Jane Smith",
      messages: [
        message(
          "2026-08-01",
          "Individual",
          "I have provided identity documents.",
          "individual",
          "A"
        ),
        message(
          "2026-08-02",
          "Jane Smith",
          "Verify your identity before we engage.",
          "institution",
          "B"
        ),
      ],
    });

    assert.equal(finding.named_individual, "Jane Smith");
    assert.equal(finding.accountability_finding, "SOVEREIGN");
  });

  it("is NULL when named_individual is null", () => {
    const finding = classifyThread({
      institution: "Example Institution",
      named_individual: null,
      messages: [
        message(
          "2026-08-01",
          "Individual",
          "I have provided identity documents.",
          "individual",
          "A"
        ),
        message(
          "2026-08-02",
          "Darlington Borough Council",
          "Verify your identity before we engage.",
          "institution",
          "B"
        ),
      ],
    });

    assert.equal(finding.named_individual, null);
    assert.equal(finding.accountability_finding, "NULL");
  });

  it("does not infer a person from an institutional sender", () => {
    const finding = classifyThread({
      messages: [
        message(
          "2026-08-01",
          "Individual",
          "I have provided identity documents.",
          "individual",
          "A"
        ),
        message(
          "2026-08-02",
          "Darlington Borough Council",
          "Verify your identity before we engage.",
          "institution",
          "B"
        ),
      ],
    });

    assert.equal(finding.named_individual, null);
    assert.equal(finding.accountability_finding, "NULL");
  });

  it("is NULL when named_individual is an empty string", () => {
    const finding = classifyThread({
      institution: "Example Institution",
      named_individual: "   ",
      messages: [
        message(
          "2026-08-01",
          "Institution",
          "We have received your message.",
          "institution",
          "A"
        ),
      ],
    });

    assert.equal(finding.named_individual, null);
    assert.equal(finding.accountability_finding, "NULL");
  });
});
