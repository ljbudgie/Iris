/**
 * Response Templates — recognises what kind of response is needed and
 * provides formatting guidance to the model via system prompt injection.
 *
 * Template types:
 *   legal       — formal tone, numbered points, statutory references
 *   code        — syntax-highlighted, language detection
 *   analysis    — structured sections, key findings first
 *   creative    — clean prose, no unnecessary formatting
 *   research    — sources cited, multiple perspectives, confidence levels
 *   emotional   — warm, direct, no bullet points
 *   quick       — one line, no preamble
 */

export type ResponseTemplate =
  | "legal"
  | "code"
  | "analysis"
  | "creative"
  | "research"
  | "emotional"
  | "quick"
  | "general";

export type TemplateResult = {
  template: ResponseTemplate;
  instruction: string;
  confidence: number;
};

// ---- Detection patterns ----

const LEGAL_TRIGGERS = [
  /\b(draft a letter|write to|formal complaint|respond to this email)\b/i,
  /\b(solicitor|barrister|legal|court|tribunal|claim|dispute|enforcement)\b/i,
  /\b(council tax|parking fine|bailiff|DSAR|freedom of information|GDPR)\b/i,
  /\b(burgess principle|reasonable adjustments|equality act|human review)\b/i,
  /\b(dear sir|to whom it may concern|formal notice)\b/i,
];

const CODE_TRIGGERS = [
  /```[\s\S]*?```/,
  /\b(debug|fix|refactor|implement|code|function|class|build|deploy|compile)\b/i,
  /\b(error|bug|stack trace|exception|crash|undefined|null pointer)\b/i,
  /\b(how to|how do I)\b.*\b(code|program|script|api|endpoint|database)\b/i,
];

const ANALYSIS_TRIGGERS = [
  /\b(analyse|analyze|compare|evaluate|assess|review|examine|break down)\b/i,
  /\b(pros and cons|advantages|disadvantages|trade-?offs)\b/i,
  /\b(what are the implications|what does this mean|interpret)\b/i,
  /\b(data|statistics|metrics|numbers|performance|trends)\b/i,
];

const CREATIVE_TRIGGERS = [
  /\b(write me|write a|compose|create a story|poem|essay|blog|article|narrative)\b/i,
  /\b(fiction|novel|character|dialogue|script|screenplay)\b/i,
  /\b(rewrite|rephrase|paraphrase|make it sound)\b/i,
];

const RESEARCH_TRIGGERS = [
  /\b(research|sources|evidence|studies|papers|literature|citations)\b/i,
  /\b(what do experts say|scientific|peer-?reviewed|according to)\b/i,
  /\b(multiple perspectives|different views|arguments for and against)\b/i,
];

const EMOTIONAL_TRIGGERS = [
  /\b(I feel|I'm feeling|I'm struggling|I'm scared|I'm worried|I'm anxious)\b/i,
  /\b(help me cope|I don't know what to do|I'm overwhelmed|I'm stressed)\b/i,
  /\b(grief|loss|lonely|depressed|burnout|exhausted|frustrated)\b/i,
  /\b(difficult situation|going through|hard time|bad day|tough)\b/i,
  /\b(support|comfort|advice|talk about)\b/i,
];

const QUICK_INDICATORS = [
  /^(what is|who is|where is|when did|how many|how much|define)\b/i,
  /^(yes or no|true or false)\b/i,
  /^(convert|translate|what's the)\b/i,
];

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      count++;
    }
  }
  return count;
}

/**
 * Detect the appropriate response template for a message.
 */
export function detectTemplate(message: string): TemplateResult {
  const text = message.trim();
  const wordCount = text.split(/\s+/).length;

  // Quick answer detection — short messages with simple patterns
  if (wordCount <= 12 && countMatches(text, QUICK_INDICATORS) > 0) {
    return {
      template: "quick",
      instruction: TEMPLATE_INSTRUCTIONS.quick,
      confidence: 0.85,
    };
  }

  const scores: Record<ResponseTemplate, number> = {
    legal: countMatches(text, LEGAL_TRIGGERS),
    code: countMatches(text, CODE_TRIGGERS),
    analysis: countMatches(text, ANALYSIS_TRIGGERS),
    creative: countMatches(text, CREATIVE_TRIGGERS),
    research: countMatches(text, RESEARCH_TRIGGERS),
    emotional: countMatches(text, EMOTIONAL_TRIGGERS),
    quick: 0,
    general: 0,
  };

  const entries = Object.entries(scores) as [ResponseTemplate, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const [topTemplate, topScore] = entries[0];

  if (topScore < 1) {
    return {
      template: "general",
      instruction: TEMPLATE_INSTRUCTIONS.general,
      confidence: 0.5,
    };
  }

  const secondScore = entries[1]?.[1] ?? 0;
  const confidence = Math.min(
    0.95,
    0.5 + (topScore - secondScore) * 0.15 + topScore * 0.05
  );

  return {
    template: topTemplate,
    instruction: TEMPLATE_INSTRUCTIONS[topTemplate],
    confidence,
  };
}

// ---- Template formatting instructions (injected into system prompt) ----

const TEMPLATE_INSTRUCTIONS: Record<ResponseTemplate, string> = {
  legal: `Response format: Legal correspondence.
- Use formal, professional tone throughout
- Number all points sequentially
- Reference relevant statutes and regulations
- Include proper salutation and sign-off
- Structure: greeting, context, numbered points, requested action, closing
- Never use casual language or emoji`,

  code: `Response format: Technical/Code.
- Use syntax-highlighted code blocks with language tags
- Detect and specify the programming language
- Include brief explanations before code blocks
- Focus on working, runnable solutions
- Note any dependencies or prerequisites`,

  analysis: `Response format: Structured analysis.
- Lead with key findings or conclusion
- Use clear section headings
- Cite evidence for claims
- Present multiple angles where relevant
- End with a clear conclusion or recommendation`,

  creative: `Response format: Creative writing.
- Use clean, flowing prose
- Avoid unnecessary formatting, bullet points, or headers
- Match or complement the user's writing style
- Focus on voice, rhythm, and readability
- Let the content breathe — no over-structuring`,

  research: `Response format: Research summary.
- Cite sources where possible
- Present multiple perspectives fairly
- Indicate confidence levels for claims
- Distinguish established facts from emerging findings
- Use structured sections for clarity`,

  emotional: `Response format: Emotional support.
- Be warm, genuine, and direct
- Use natural prose — no bullet points, no clinical language
- Acknowledge the person's feelings specifically
- Avoid platitudes and generic advice
- Speak as a caring friend, not a therapist
- Never start with "I'm sorry to hear that"`,

  quick: `Response format: Quick answer.
- One line or one short paragraph maximum
- No preamble, no "Great question!", no filler
- Just the answer, directly and clearly`,

  general: `Response format: Conversational.
- Be clear and helpful
- Use structure when it aids understanding
- Keep it natural and direct
- Match the user's energy and complexity level`,
};

/**
 * Get the template instruction string for a given template type.
 */
export function getTemplateInstruction(template: ResponseTemplate): string {
  return TEMPLATE_INSTRUCTIONS[template];
}
