import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkCodeStyleGuide, type CodeStyleRule } from './checkCodeStyleGuide.js';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sampleRules: readonly CodeStyleRule[] = [
  {
    id: 'function.domain-name',
    statement: 'Functions state the domain action.',
    verify: 'judgment',
  },
  {
    id: 'tooling.biome',
    statement: 'Biome owns formatting.',
    verify: 'npm run check:ci',
  },
];

type CardDefinition = {
  readonly id: string;
  readonly assertion: string;
  readonly verification: string;
};

const ruleCard = (cardDefinition: CardDefinition): string =>
  [
    `### ${cardDefinition.id}`,
    `[rule:${cardDefinition.id}] · verify: ${cardDefinition.verification}`,
    '',
    cardDefinition.assertion,
    '',
    '```ts',
    '// ✓ domain name',
    'const publishOffer = async () => {};',
    '',
    '// ✗ vague name',
    'const execute = async () => {};',
    '```',
    '',
    'Why: names carry product intent.',
  ].join('\n');

const conformingCards = [
  ruleCard({
    id: 'function.domain-name',
    assertion: 'Functions state the domain action.',
    verification: 'judgment',
  }),
  ruleCard({
    id: 'tooling.biome',
    assertion: 'Biome owns formatting.',
    verification: '`npm run check:ci`',
  }),
];

const styleGuide = (cards: readonly string[]): string =>
  [
    '# Code style',
    '',
    '## Rules',
    '',
    ...cards,
    '',
    '## Canonical example',
    '',
    '## Golden path',
    '',
    '## Exemplars',
    '',
    '## Never',
    '',
  ].join('\n');

describe('repository code-style contract', () => {
  it('keeps CODE-STYLE.md and its machine mirror aligned', () => {
    const guideText = readFileSync(join(repositoryRoot, 'CODE-STYLE.md'), 'utf8');
    const rulesDocument = JSON.parse(
      readFileSync(join(repositoryRoot, 'code-style.rules.json'), 'utf8'),
    ) as {
      readonly rules: readonly CodeStyleRule[];
    };

    expect(checkCodeStyleGuide({ guideText, rules: rulesDocument.rules })).toEqual([]);
  });

  it('accepts a conforming guide', () => {
    expect(
      checkCodeStyleGuide({ guideText: styleGuide(conformingCards), rules: sampleRules }),
    ).toEqual([]);
  });

  it('rejects machine-mirror assertion drift', () => {
    const guideText = styleGuide(conformingCards).replace(
      'Functions state the domain action.',
      'Functions hide the domain action.',
    );
    const messages = checkCodeStyleGuide({ guideText, rules: sampleRules }).map(
      (violation) => violation.message,
    );

    expect(messages).toContain(
      'Rule function.domain-name assertion differs from code-style.rules.json.',
    );
  });

  it('rejects rule-order drift', () => {
    const reversedCards = [...conformingCards];
    reversedCards.reverse();
    const messages = checkCodeStyleGuide({
      guideText: styleGuide(reversedCards),
      rules: sampleRules,
    }).map((violation) => violation.message);

    expect(messages).toContain('Rule cards and code-style.rules.json must use the same order.');
  });

  it('requires both chosen and rejected examples', () => {
    const guideText = styleGuide(conformingCards).replace('// ✗ vague name\n', '');
    const messages = checkCodeStyleGuide({ guideText, rules: sampleRules }).map(
      (violation) => violation.message,
    );

    expect(messages).toContain('Rule function.domain-name example needs a "// ✗" case.');
  });
});
