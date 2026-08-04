import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const compilerOutputDirectory = fileURLToPath(new URL('../../build/', import.meta.url));

rmSync(compilerOutputDirectory, { force: true, recursive: true });
