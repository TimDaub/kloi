// @format
import process from "process";
import path from "path";
import crypto from "crypto";
import tree from "directory-tree";

import { NotImplementedError } from "./errors.mjs";

export { tree };

const cache = new Map();
// TODO: Figure out if we should use "clear-module" here.
function getNewToken(path) {
  let count;

  if (cache.has(path)) {
    let count = cache.get(path);
    count++;
  } else {
    count = 0;
    cache.set(path, count);
  }

  return `${path}?count=${count}`;
}

export function labelFile(name) {
  const expr = new RegExp("(server|client)+", "gm");

  if (expr.test(name)) {
    return name.match(expr).pop();
  } else {
    throw new NotImplementedError(
      `'Shared Components' are not yet supported. Please prepend your modules with '.client.mjs' or '.server.mjs'`
    );
  }
}

export async function* traverse(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.type === "directory") {
      files = files.concat(file.children);
    } else {
      yield file;
    }
  }
}

export async function load(file) {
  file.absolutePath = path.resolve(process.cwd(), file.path);
  file.label = labelFile(file.name);

  const uncachedPath = getNewToken(file.absolutePath);
  file.module = (await import(uncachedPath)).default;

  return file;
}

export async function loadDir(path, options) {
  let dirTree = tree(path, options);
  const fileIterator = await traverse(dirTree.children);

  let res = await fileIterator.next();
  while (!res.done) {
    res.value = await load(res.value);
    res = await fileIterator.next();
  }

  return dirTree;
}
