// @format
import ava from "ava";
import path from "path";
import { fileURLToPath } from "url";
import { rmdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { Worker } from "worker_threads";
import { once } from "events";

const test = ava.serial;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_FOLDER = path.resolve(__dirname, "./virtual_project");

test.afterEach.always(t => {
  rmdirSync(TEST_FOLDER, { recursive: true });
  mkdirSync(TEST_FOLDER);
  writeFileSync(`${TEST_FOLDER}/.keep`, "");
});

test("if usage readme example works", async t => {
  mkdirSync(`${TEST_FOLDER}/src`);
  mkdirSync(`${TEST_FOLDER}/dist`);
  mkdirSync(`${TEST_FOLDER}/src/pages`);
  writeFileSync(
    `${TEST_FOLDER}/src/pages/index.server.mjs`,
    `
    const hello = "world";
    export default hello;
  `
  );
  mkdirSync(`${TEST_FOLDER}/src/pages/subdir`);
  mkdirSync(`${TEST_FOLDER}/src/pages/subdir/subsubdir`);
  writeFileSync(
    `${TEST_FOLDER}/src/pages/subdir/subdirfile.server.mjs`,
    `
    const hello = "subdir";
    export default hello;
  `
  );

  const md = readFileSync(path.resolve(__dirname, "../README.md"));
  const text = md.toString();
  const expr = new RegExp("```(?:js|javascript)\\n([\\s\\S]*?)```", "gm");
  const example = `
    \`\`\`js
      const hello = "world";
    \`\`\`
  `;

  let [matchRes] = example.match(expr);
  t.assert(matchRes === '```js\n      const hello = "world";\n    ```');

  matchRes = matchRes.replace("```js\n", "");
  matchRes = matchRes.replace("\n```", "");
  t.assert(!matchRes.includes("```js\n"));
  t.assert(!matchRes.includes("\n```"));

  let [readmeMatch] = text.match(expr);
  readmeMatch = readmeMatch.replace("```js\n", "");
  readmeMatch = readmeMatch.replace("\n```", "");
  readmeMatch = readmeMatch.replace(
    "kloi",
    `file://${path.resolve(__dirname, "../src/index.mjs")}`
  );

  // NOTE: Here we make sure that errors are thrown
  await t.throwsAsync(
    async () => {
      const failingWorker = new Worker(
        new URL(`throw new Error("testing")\n${readmeMatch}`)
      );
      await once(failingWorker, "error");
    },
    { instanceOf: Error }
  );

  const worker = new Worker(new URL(`data:text/javascript,${readmeMatch}`));
  let message;
  try {
    [message] = await once(worker, "message");
  } catch (err) {
    console.error(err);
    t.fail();
  }

  t.true(existsSync(`${TEST_FOLDER}/dist/index.html`));
  t.true(existsSync(`${TEST_FOLDER}/dist/subdir/subdirfile.html`));
});
