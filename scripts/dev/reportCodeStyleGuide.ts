import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { z } from 'zod';
import { checkCodeStyleGuide } from './checkCodeStyleGuide.js';

const codeStyleRuleSchema = z
  .object({
    id: z.string(),
    statement: z.string(),
    verify: z.string(),
  })
  .strict();

const rulesDocumentSchema = z
  .object({
    version: z.number(),
    guide: z.string(),
    migration: z
      .object({
        status: z.string(),
        note: z.string(),
      })
      .strict(),
    rules: z.array(codeStyleRuleSchema),
  })
  .strict();

function repositoryRootFromCommand(): string {
  const requestedRoot = process.argv.at(2);
  if (requestedRoot === undefined) {
    return resolve(process.cwd());
  }

  return resolve(requestedRoot);
}

const repositoryRoot = repositoryRootFromCommand();
const guidePath = join(repositoryRoot, 'CODE-STYLE.md');
const rulesPath = join(repositoryRoot, 'code-style.rules.json');
const missingPaths = [guidePath, rulesPath].filter((candidatePath) => !existsSync(candidatePath));

if (missingPaths.length > 0) {
  process.stdout.write(`${repositoryRoot}\n  missing: ${missingPaths.join(', ')}\n`);
  process.exitCode = 1;
} else {
  const rulesDocument = rulesDocumentSchema.parse(JSON.parse(readFileSync(rulesPath, 'utf8')));
  const violations = checkCodeStyleGuide({
    guideText: readFileSync(guidePath, 'utf8'),
    rules: rulesDocument.rules,
  });

  for (const violation of violations) {
    process.stdout.write(`  CODE-STYLE.md:${violation.line}  ${violation.message}\n`);
  }

  if (violations.length === 0) {
    process.stdout.write(
      `${repositoryRoot}\n  OK — ${rulesDocument.rules.length} rule cards conform\n`,
    );
  } else {
    process.stdout.write(
      `${repositoryRoot}\n  ${violations.length} format violations across ${rulesDocument.rules.length} declared rules\n`,
    );
  }

  if (violations.length > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}
