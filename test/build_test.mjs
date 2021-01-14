// @format
import path from "path";
import { fileURLToPath } from "url";
import {
  existsSync,
  unlinkSync,
  writeFileSync,
  mkdirSync,
  rmdirSync
} from "fs";
import ava from "ava";

import { readDirectoryTree } from "../src/build.mjs";

const test = ava.serial;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_FOLDER = path.resolve(__dirname, "./virtual_project");

test.afterEach.always(t => {
  rmdirSync(TEST_FOLDER, { recursive: true });
  mkdirSync(TEST_FOLDER);
  writeFileSync(`${TEST_FOLDER}/.keep`, "");
});

test("if tree folder structure is parsed correctly", t => {
  writeFileSync(`${TEST_FOLDER}/testfile.js`, "testfile");
  mkdirSync(`${TEST_FOLDER}/testdir`);
  writeFileSync(`${TEST_FOLDER}/testdir/testfile2.js`, "testfile2");

  const projectStruct = readDirectoryTree(TEST_FOLDER);
  t.is(projectStruct.children.length, 3);

  const testDir = projectStruct.children.find(
    elem => elem.type === "directory"
  );
  t.is(testDir.children.length, 1);

  t.truthy(projectStruct.children.find(({ name }) => name === "testfile.js"));
  t.truthy(testDir.children.find(({ name }) => name === "testfile2.js"));
});
