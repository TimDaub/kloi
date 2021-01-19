// @format
import process from "process";
import path from "path";
import crypto from "crypto";

import { html } from "htm/preact/index.js";
import renderToString from "preact-render-to-string";
import tree from "directory-tree";

import { NotImplementedError } from "./errors.mjs";

export { tree };

const cache = new Map();
// TODO: Figure out if we should use "clear-module" here.
export function getNewToken(path) {
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

export function labelModule(file) {
  const expr = new RegExp("(server|client)+", "gm");

  if (expr.test(file.name)) {
    return {
      ...file,
      label: file.name.match(expr).pop()
    };
  } else {
    throw new NotImplementedError(
      `'Shared Components' are not yet supported. Please prepend your modules with '.client.mjs' or '.server.mjs'`
    );
  }
}

async function loadModule(file) {
  const absolutePath = path.resolve(process.cwd(), file.path);
  const uncachedPath = getNewToken(absolutePath);
  const loadedMod = (await import(uncachedPath)).default;
  return {
    ...file,
    module: loadedMod
  };
}

export function renderModule(file, props) {
  const doc = html`<${file.module} ...${props} />`;

  return {
    ...file,
    render: renderToString(doc)
  };
}

export async function render(file) {
  file = await loadModule(file);
  file = labelModule(file);
  file = renderModule(file);
  return file;
}
