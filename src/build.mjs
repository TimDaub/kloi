// @format
import process from "process";
import path from "path";
import crypto from "crypto";

import dirTree from "directory-tree";

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

async function traverse(files) {
  for (let file of files) {
    if (file.type === "directory") {
      await traverse(file.children);
    } else {
      file.absolutePath = path.resolve(process.cwd(), file.path);

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
