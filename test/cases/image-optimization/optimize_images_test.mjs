// @format
import path from "path";
import { once } from "events";
import { fileURLToPath } from "url";
import { existsSync, statSync, rmdirSync } from "fs";
import process from "process";
import { Worker } from "worker_threads";

import test from "ava";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "project");

test("if optimizing images works", async t => {
  const p = path.resolve(projectDir, "kloi.config.mjs");
  t.true(existsSync(p));
  const regularWD = process.cwd();
  process.chdir(projectDir);

  const pOptimized1 = path.resolve(projectDir, "dist/images/saturn.jpg");
  const pOptimized2 = path.resolve(projectDir, "dist/images/light.png");
  t.false(existsSync(pOptimized1));
  t.false(existsSync(pOptimized2));

  await new Promise((resolve, reject) => {
    const worker = new Worker(new URL(`file://${p}`), {
      execArgv: [...process.execArgv, "--unhandled-rejections=strict"]
    });
    worker.on("error", reject);
    worker.on("exit", code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });

  const original1 = statSync(path.resolve(projectDir, "src/images/saturn.jpg"))
    .size;
  const optimized1 = statSync(pOptimized1).size;
  const original2 = statSync(path.resolve(projectDir, "src/images/light.png"))
    .size;
  const optimized2 = statSync(pOptimized2).size;

  t.true(original1 > optimized1);
  t.true(original2 > optimized2);

  // NOTE: Cleanup after test
  process.chdir(regularWD);
  rmdirSync(path.resolve(projectDir, "dist/images"), { recursive: true });
  t.false(existsSync(pOptimized1));
  t.false(existsSync(pOptimized2));
});
