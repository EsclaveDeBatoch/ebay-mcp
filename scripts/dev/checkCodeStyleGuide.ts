// biome-ignore-all lint/style/noExcessiveLinesPerFile: The complete rule-card grammar stays in one dependency-free checker.

type CodeStyleRule = {
  readonly id: string;
  readonly statement: string;
  readonly verify: string;
};

type CodeStyleViolation = {
  readonly ruleId: string;
  readonly line: number;
  readonly message: string;
};

type GuideContract = {
  readonly guideText: string;
  readonly rules: readonly CodeStyleRule[];
};

type SectionHeading = {
  readonly title: string;
  readonly line: number;
};

type RuleCardRange = {
  readonly heading: string;
  readonly headingLine: number;
  readonly start: number;
  readonly end: number;
};

const REQUIRED_SECTIONS = ['Rules', 'Canonical example', 'Golden path', 'Exemplars', 'Never'];
const METADATA_PATTERN =
  /^\[rule:([a-z][a-z0-9]*(?:[._-][a-z0-9]+)*)\] · verify: (?:`([^`]+)`|judgment)$/u;
const STRUCTURAL_PREFIX_PATTERN = /^[-*#|>`]/u;
const FORMAT_RULE_ID = 'format.rule-card';

const fencedLineNumbers = (lines: readonly string[]): ReadonlySet<number> => {
  const fencedLines = new Set<number>();
  const encounteredFences: number[] = [];

  for (const [index, text] of lines.entries()) {
    if (text.startsWith('```')) {
      encounteredFences.push(index);
    }

    if (encounteredFences.length % 2 === 1) {
      fencedLines.add(index);
    }
  }

  return fencedLines;
};

const sectionHeadings = (
  lines: readonly string[],
  fencedLines: ReadonlySet<number>,
): readonly SectionHeading[] => {
  const headings: SectionHeading[] = [];

  for (const [index, text] of lines.entries()) {
    if (!text.startsWith('## ')) {
      continue;
    }

    if (fencedLines.has(index)) {
      continue;
    }

    headings.push({ title: text.slice(3).trim(), line: index + 1 });
  }

  return headings;
};

const rulesSection = (
  lines: readonly string[],
  fencedLines: ReadonlySet<number>,
): { readonly start: number; readonly end: number } | undefined => {
  const start = lines.findIndex((text, index) => text === '## Rules' && !fencedLines.has(index));
  if (start < 0) {
    return;
  }

  const nextHeading = lines.findIndex(
    (text, index) => index > start && text.startsWith('## ') && !fencedLines.has(index),
  );
  if (nextHeading < 0) {
    return { start, end: lines.length };
  }

  return { start, end: nextHeading };
};

const ruleCardRanges = (
  lines: readonly string[],
  fencedLines: ReadonlySet<number>,
  section: { readonly start: number; readonly end: number },
): readonly RuleCardRange[] => {
  const headingIndexes: number[] = [];

  for (const [index, text] of lines.entries()) {
    if (
      index > section.start &&
      index < section.end &&
      text.startsWith('### ') &&
      !fencedLines.has(index)
    ) {
      headingIndexes.push(index);
    }
  }

  return headingIndexes.map((headingIndex, position) => {
    const nextHeading = headingIndexes.at(position + 1);
    const headingText = lines.at(headingIndex);
    if (headingText === undefined) {
      throw new Error(`Missing rule-card heading at line ${headingIndex + 1}.`);
    }

    if (nextHeading === undefined) {
      return {
        heading: headingText.slice(4).trim(),
        headingLine: headingIndex + 1,
        start: headingIndex,
        end: section.end,
      };
    }

    return {
      heading: headingText.slice(4).trim(),
      headingLine: headingIndex + 1,
      start: headingIndex,
      end: nextHeading,
    };
  });
};

function firstNonBlankLine(
  lines: readonly string[],
  start: number,
  end: number,
): number | undefined {
  for (const [index, text] of lines.entries()) {
    if (index >= start && index < end && text.trim().length > 0) {
      return index;
    }
  }
}

const verificationFrom = (metadataMatch: RegExpExecArray): string => {
  const command = metadataMatch.at(2);
  if (command === undefined) {
    return 'judgment';
  }

  return command;
};

const singleSentence = (assertion: string): boolean => {
  if (!assertion.endsWith('.')) {
    return false;
  }

  if (assertion.includes('. ')) {
    return false;
  }

  return !STRUCTURAL_PREFIX_PATTERN.test(assertion);
};

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Keeping the card slots together makes the enforced format readable.
const checkRuleCard = (
  lines: readonly string[],
  card: RuleCardRange,
  rulesById: ReadonlyMap<string, CodeStyleRule>,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: One card is a linear grammar with independent diagnostics.
): readonly CodeStyleViolation[] => {
  const violations: CodeStyleViolation[] = [];
  const metadataIndex = firstNonBlankLine(lines, card.start + 1, card.end);
  if (metadataIndex === undefined) {
    return [
      {
        ruleId: FORMAT_RULE_ID,
        line: card.headingLine,
        message: `Card "${card.heading}" needs rule metadata directly beneath its heading.`,
      },
    ];
  }

  const metadata = lines.at(metadataIndex);
  if (metadata === undefined) {
    throw new Error(`Missing metadata at line ${metadataIndex + 1}.`);
  }

  const metadataMatch = METADATA_PATTERN.exec(metadata.trim());
  if (metadataMatch === null) {
    return [
      {
        ruleId: FORMAT_RULE_ID,
        line: metadataIndex + 1,
        message: `Card "${card.heading}" needs "[rule:<id>] · verify: \`<command>\`" or "verify: judgment".`,
      },
    ];
  }

  const ruleId = metadataMatch.at(1);
  if (ruleId === undefined) {
    throw new Error(`Missing rule identifier at line ${metadataIndex + 1}.`);
  }

  const verification = verificationFrom(metadataMatch);
  const machineRule = rulesById.get(ruleId);
  if (machineRule === undefined) {
    violations.push({
      ruleId: FORMAT_RULE_ID,
      line: metadataIndex + 1,
      message: `Rule ${ruleId} has no entry in code-style.rules.json.`,
    });
  }

  if (machineRule !== undefined && machineRule.verify !== verification) {
    violations.push({
      ruleId,
      line: metadataIndex + 1,
      message: `Rule ${ruleId} documents verify "${verification}" but the machine mirror records "${machineRule.verify}".`,
    });
  }

  const assertionIndex = firstNonBlankLine(lines, metadataIndex + 1, card.end);
  if (assertionIndex === undefined) {
    violations.push({
      ruleId,
      line: card.headingLine,
      message: `Rule ${ruleId} needs one assertion sentence.`,
    });
    return violations;
  }

  const assertion = lines.at(assertionIndex);
  if (assertion === undefined) {
    violations.push({
      ruleId,
      line: assertionIndex + 1,
      message: `Rule ${ruleId} needs one assertion sentence before its example.`,
    });
    return violations;
  }

  if (assertion.startsWith('```')) {
    violations.push({
      ruleId,
      line: assertionIndex + 1,
      message: `Rule ${ruleId} needs one assertion sentence before its example.`,
    });
    return violations;
  }

  if (!singleSentence(assertion.trim())) {
    violations.push({
      ruleId,
      line: assertionIndex + 1,
      message: `Rule ${ruleId} must have one assertion sentence ending in a period.`,
    });
  }

  if (machineRule !== undefined && machineRule.statement !== assertion.trim()) {
    violations.push({
      ruleId,
      line: assertionIndex + 1,
      message: `Rule ${ruleId} assertion differs from code-style.rules.json.`,
    });
  }

  const fenceIndexes: number[] = [];
  for (const [index, text] of lines.entries()) {
    if (index > assertionIndex && index < card.end && text.startsWith('```')) {
      fenceIndexes.push(index);
    }
  }

  if (fenceIndexes.length !== 2) {
    violations.push({
      ruleId,
      line: assertionIndex + 1,
      message: `Rule ${ruleId} needs exactly one fenced example block.`,
    });
    return violations;
  }

  const fenceOpen = fenceIndexes.at(0);
  const fenceClose = fenceIndexes.at(1);
  if (fenceOpen === undefined) {
    throw new Error(`Incomplete example fence for ${ruleId}.`);
  }

  if (fenceClose === undefined) {
    throw new Error(`Incomplete example fence for ${ruleId}.`);
  }

  const exampleText = lines.slice(fenceOpen + 1, fenceClose).join('\n');
  if (!exampleText.includes('// ✓')) {
    violations.push({
      ruleId,
      line: fenceOpen + 1,
      message: `Rule ${ruleId} example needs a "// ✓" case.`,
    });
  }

  if (!exampleText.includes('// ✗')) {
    violations.push({
      ruleId,
      line: fenceOpen + 1,
      message: `Rule ${ruleId} example needs a "// ✗" case.`,
    });
  }

  const hasWhy = lines
    .slice(fenceClose + 1, card.end)
    .some((text) => text.trim().startsWith('Why:'));
  if (!hasWhy) {
    violations.push({
      ruleId,
      line: fenceClose + 1,
      message: `Rule ${ruleId} needs a "Why:" line.`,
    });
  }

  return violations;
};

const sectionViolations = (headings: readonly SectionHeading[]): readonly CodeStyleViolation[] => {
  const violations: CodeStyleViolation[] = [];
  const sectionLines: number[] = [];

  for (const requiredTitle of REQUIRED_SECTIONS) {
    const matchingHeading = headings.find((heading) => heading.title.startsWith(requiredTitle));
    if (matchingHeading === undefined) {
      violations.push({
        ruleId: FORMAT_RULE_ID,
        line: 1,
        message: `CODE-STYLE.md needs a "## ${requiredTitle}" section.`,
      });
      continue;
    }

    sectionLines.push(matchingHeading.line);
  }

  for (const [position, line] of sectionLines.entries()) {
    if (position === 0) {
      continue;
    }

    const previousLine = sectionLines.at(position - 1);
    if (previousLine !== undefined && line < previousLine) {
      violations.push({
        ruleId: FORMAT_RULE_ID,
        line,
        message: 'Required CODE-STYLE.md sections are out of order.',
      });
      break;
    }
  }

  return violations;
};

const mirrorViolations = (
  cards: readonly RuleCardRange[],
  lines: readonly string[],
  rules: readonly CodeStyleRule[],
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Mirror parity checks malformed, duplicate, missing, and ordered IDs together.
): readonly CodeStyleViolation[] => {
  const violations: CodeStyleViolation[] = [];
  const documentedIds: string[] = [];
  const ruleCounts = new Map<string, number>();

  for (const card of cards) {
    const metadataIndex = firstNonBlankLine(lines, card.start + 1, card.end);
    if (metadataIndex === undefined) {
      continue;
    }

    const metadata = lines.at(metadataIndex);
    if (metadata === undefined) {
      continue;
    }

    const metadataMatch = METADATA_PATTERN.exec(metadata.trim());
    const ruleId = metadataMatch?.at(1);
    if (ruleId === undefined) {
      continue;
    }

    documentedIds.push(ruleId);
    const previousCount = ruleCounts.get(ruleId);
    if (previousCount === undefined) {
      ruleCounts.set(ruleId, 1);
      continue;
    }

    ruleCounts.set(ruleId, previousCount + 1);
  }

  for (const [ruleId, count] of ruleCounts) {
    if (count > 1) {
      violations.push({
        ruleId: FORMAT_RULE_ID,
        line: 1,
        message: `Rule ${ruleId} has more than one card in CODE-STYLE.md.`,
      });
    }
  }

  for (const machineRule of rules) {
    if (!ruleCounts.has(machineRule.id)) {
      violations.push({
        ruleId: FORMAT_RULE_ID,
        line: 1,
        message: `Rule ${machineRule.id} has no card in CODE-STYLE.md.`,
      });
    }
  }

  const machineIds = rules.map((machineRule) => machineRule.id);
  if (documentedIds.join('\n') !== machineIds.join('\n')) {
    violations.push({
      ruleId: FORMAT_RULE_ID,
      line: 1,
      message: 'Rule cards and code-style.rules.json must use the same order.',
    });
  }

  return violations;
};

export const checkCodeStyleGuide = (
  guideContract: GuideContract,
): readonly CodeStyleViolation[] => {
  const lines = guideContract.guideText.split('\n');
  const fencedLines = fencedLineNumbers(lines);
  const headings = sectionHeadings(lines, fencedLines);
  const violations = [...sectionViolations(headings)];
  const section = rulesSection(lines, fencedLines);
  if (section === undefined) {
    return violations;
  }

  const cards = ruleCardRanges(lines, fencedLines, section);
  const rulesById = new Map(
    guideContract.rules.map((machineRule) => [machineRule.id, machineRule]),
  );
  for (const card of cards) {
    violations.push(...checkRuleCard(lines, card, rulesById));
  }
  violations.push(...mirrorViolations(cards, lines, guideContract.rules));

  return violations.sort((left, right) => {
    const lineDifference = left.line - right.line;
    if (lineDifference !== 0) {
      return lineDifference;
    }

    return left.ruleId.localeCompare(right.ruleId);
  });
};

export type { CodeStyleRule, CodeStyleViolation };
