// @ts-check

import { mkdir, writeFile, rm, appendFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Core } from '../dist/core.js';

/** @typedef {{ label: string, source: string, amount: number }} Case */

/**
 * @param {string} fixturesDirPath
 * @param {Case[]} cases
 */
export async function createFixtures(fixturesDirPath, cases) {
  // remove old fixtures
  await rm(fixturesDirPath, { recursive: true, force: true });

  // create fixtures directory
  await mkdir(fixturesDirPath, { recursive: true });

  // create fixtures
  /** @type {Promise<void>[]} */
  const promises = [];
  for (const c of cases) {
    for (let i = 0; i < c.amount; i++) {
      const promise = writeFile(join(fixturesDirPath, `${c.label}-${i + 1}.js`), c.source);
      promises.push(promise);
    }
  }
  await Promise.all(promises);
}

/**
 * @param {Core} core
 */
export async function runBenchmarkForEachFix(core) {
  const results = await core.lint();
  {
    const undo = await core.applyAutoFixes(results, ['semi', 'arrow-body-style']);
    await undo();
  }
  {
    // disablePerLine
    const undo = await core.disablePerLine(results, ['semi', 'arrow-body-style']);
    await undo();
  }
  {
    // disablePerFile
    const undo = await core.disablePerFile(results, ['semi', 'arrow-body-style']);
    await undo();
  }
  {
    // makeFixableAndFix
    const undo = await core.makeFixableAndFix(results, ['semi', 'arrow-body-style'], (message) => {
      return message.fix;
    });
    await undo();
  }
}
