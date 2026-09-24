import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { governTurn } from "../../lib/ai/governing-layer";
import { buildIrisSystemPrompt } from "../../lib/ai/system-prompt";

const QUESTION =
  "Was a human member of the team able to personally review the specific facts of my specific situation?";

describe("governing layer", () => {
  it("does not classify ordinary chat", () => {
    assert.equal(governTurn("Hello Iris, how does this work?"), null);
  });

  it("classifies an automated refusal as NULL", () => {
    const turn = governTurn(
      "They sent this: This is an automated message from a no-reply address. Your claim has been refused. Your case has been processed by our system. Do not reply to this email."
    );

    assert.ok(turn?.stamp);
    assert.equal(turn?.stamp?.classification, "NULL");
    assert.match(turn?.note ?? "", /BINDING FINDING/);
    assert.match(turn?.note ?? "", /Do not reclassify/);
  });

  it("keeps process language AMBIGUOUS even when the message is also automated", () => {
    const turn = governTurn(
      "Their letter says: This is an automated message. Your claim has been processed. It was reviewed in line with our policy and is subject to human oversight by a member of the team."
    );

    assert.equal(turn?.stamp?.classification, "AMBIGUOUS");
    assert.match(turn?.stamp?.noticed.join(" ") ?? "", /Human oversight/);
    assert.match(turn?.stamp?.noticed.join(" ") ?? "", /member of the team/);
  });

  it("classifies a named personal review as SOVEREIGN", () => {
    const turn = governTurn(
      "They wrote: My name is Helen Okonkwo, decision maker. I have personally reviewed the specific facts of your claim on 3 March 2026 before I refused the award. Yours sincerely, Helen Okonkwo."
    );

    assert.equal(turn?.stamp?.classification, "SOVEREIGN");
  });

  it("records an evasion as AMBIGUOUS", () => {
    const turn = governTurn(
      "They replied: We do not recognize this framework. It is a novel personal project and has not yet been battle-tested, so we cannot treat it as a standard."
    );

    assert.equal(turn?.stamp?.classification, "AMBIGUOUS");
    assert.match(turn?.stamp?.noticed.join(" ") ?? "", /Recognition denial/);
  });

  it("constrains a letter without inventing a finding from the person's own words", () => {
    const turn = governTurn(
      "A reasonable adjustment I asked for was refused. Help me draft a calm letter that asks whether a named person reviewed my specific circumstances. Not legal advice."
    );

    assert.equal(turn?.stamp, null);
    assert.match(turn?.note ?? "", /BINDING LETTER CONSTRAINT/);
    assert.match(turn?.note ?? "", new RegExp(QUESTION.replace(/[?]/g, "\\?")));
    assert.doesNotMatch(turn?.note ?? "", /Finding: NULL/);
  });

  it("puts the binding note into the system prompt", () => {
    const turn = governTurn(
      "They sent this: Your claim has been refused. This is an automated message."
    );
    const prompt = buildIrisSystemPrompt({
      modelName: "Kimi K2",
      governingNote: turn?.note,
    });

    assert.match(prompt, /BINDING FINDING/);
    assert.match(prompt, /governed by Iris/);
    assert.match(prompt, /Kimi K2/);
  });
});
