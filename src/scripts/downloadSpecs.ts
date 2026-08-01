import * as fs from 'fs';
import * as path from 'path';
import { getErrorMessage } from '@/utils/errors.js';
import { httpRequest } from '@/utils/http.js';
import { getSpecFolder } from '@/scripts/specFolderMap.js';
import { Effect, Either } from 'effect';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '../../docs');
const README_PATH = path.resolve(__dirname, '../../docs/sell-apps/README.md');

const getUrlsFromReadme = (content: string): string[] => {
  // Regex to find URLs that end with .json, specifically for OpenAPI specs
  // This assumes the README will directly link to the JSON spec files, but is less strict to allow for variations.
  const urlRegex = /(https:\/\/[^\s)]+\.json)/g;
  const urls = Array.from(content.matchAll(urlRegex)).map((match) => match[1]);
  console.log('Found URLs:', urls);
  return urls;
};

const downloadFile = async (url: string, folderPath: string, fileName: string) => {
  const downloaded = await Effect.runPromise(
    Effect.either(
      Effect.tryPromise({
        try: async () => {
          const response = await httpRequest<Buffer>({ url, responseType: 'arraybuffer' });
          const filePath = path.join(folderPath, fileName);
          fs.mkdirSync(folderPath, { recursive: true });
          fs.writeFileSync(filePath, response.data);
        },
        catch: (error) => error,
      }),
    ),
  );

  if (Either.isLeft(downloaded)) {
    console.error(`Failed to download ${url}:`, getErrorMessage(downloaded.left));
    return;
  }

  console.log(`Downloaded ${fileName} to ${folderPath}`);
};

const main = async () => {
  const readme = Effect.runSync(
    Effect.either(
      Effect.try({
        try: () => fs.readFileSync(README_PATH, 'utf-8'),
        catch: (error) => error,
      }),
    ),
  );

  if (Either.isLeft(readme)) {
    console.error('Failed to read README.md:', getErrorMessage(readme.left));
    return;
  }

  const urls = getUrlsFromReadme(readme.right);

  for (const url of urls) {
    console.log(`Processing URL: ${url}`);
    const fileName = path.basename(url);
    const folderName = getSpecFolder(url);
    const folderPath = path.join(DOCS_DIR, folderName);
    await downloadFile(url, folderPath, fileName);
  }
};

void main();
