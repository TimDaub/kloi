// @format
import process from "process";
import path from "path";
import crypto from "crypto";

import dirTree from "directory-tree";

import { NotImplementedError } from "./errors.mjs";

function readDirectoryTree(path, options) {
  return dirTree(path, options);
}

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

async function traverse(files) {
  for (let file of files) {
    if (file.type === "directory") {
      await traverse(file.children);
    } else {
      file.absolutePath = path.resolve(process.cwd(), file.path);
      file.label = labelFile(file.name);

      const uncachedPath = getNewToken(file.absolutePath);
      file.module = (await import(uncachedPath)).default;
    }
  }
  return files;
}

export async function loadDirectoryTree(path, options) {
  let tree = dirTree(path, options);
  tree.children = await traverse(tree.children);
  return tree;
}
