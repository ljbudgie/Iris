import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MODEL_CLAUSE_LETTER_PROMPT,
  MODEL_CLAUSE_MARK,
  MODEL_CLAUSE_STATUS,
  MODEL_CLAUSE_TEXT,
} from "../../lib/loop/model-clause";

describe("Model Clause canon", () => {
  it("keeps all four limbs in order", () => {
    assert.match(MODEL_CLAUSE_TEXT, /\(a\) reviewed the specific facts of the specific case/);
    assert.match(MODEL_CLAUSE_TEXT, /\(b\) confirmed that any recorded reasonable adjustment has been applied/);
    assert.match(
      MODEL_CLAUSE_TEXT,
      /\(c\) confirmed that the action is not subject to an active complaint, appeal, or legal proceeding/
    );
    assert.match(
      MODEL_CLAUSE_TEXT,
      /\(d\) recorded their name, role, and the date of the review/
    );
  });

  it("treats missing review as NULL that must not proceed", () => {
    assert.match(
      MODEL_CLAUSE_TEXT,
      /Where no such review is evidenced, the action is NULL and must not proceed/
    );
  });

  it("places the burden on the organisation when no officer can be identified", () => {
    assert.match(
      MODEL_CLAUSE_TEXT,
      /the organisation bears the burden of proving otherwise/
    );
  });

  it("does not describe the mark as fully registered", () => {
    assert.match(MODEL_CLAUSE_STATUS, /accepted by the UK IPO on 21 July 2026/);
    assert.match(MODEL_CLAUSE_STATUS, /registration are pending/);
    assert.doesNotMatch(MODEL_CLAUSE_STATUS, /fully registered/);
  });

  it("forces generated letters to quote the clause verbatim", () => {
    assert.match(MODEL_CLAUSE_LETTER_PROMPT, /VERBATIM/);
    assert.match(MODEL_CLAUSE_LETTER_PROMPT, /\(a\) reviewed the specific facts/);
    assert.equal(MODEL_CLAUSE_MARK, "UK00004343685");
  });
});
