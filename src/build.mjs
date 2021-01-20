// @format
import process from "process";
import path from "path";
import crypto from "crypto";

import { html } from "htm/preact/index.js";
import renderToString from "preact-render-to-string";
import tree from "directory-tree";

import { NotImplementedError } from "./errors.mjs";

export class ModuleLoader {
  constructor() {
    this.cache = new Map();
  }

  getNewToken(path) {
    let count;

    if (this.cache.has(path)) {
      let count = this.cache.get(path);
      count++;
    } else {
      count = 0;
      this.cache.set(path, count);
    }

    return `${path}?count=${count}`;
  }

  async load(modPath) {
    const absolutePath = path.resolve(process.cwd(), modPath);
    const uncachedPath = this.getNewToken(absolutePath);
    return (await import(uncachedPath)).default;
  }
}

export class Builder {
  constructor(config) {
    this.config = config;
    this.loader = new ModuleLoader();
  }

  static labelModule(name) {
    const expr = new RegExp("(server|client)+", "gm");

    if (expr.test(name)) {
      return name.match(expr).pop();
    } else {
      throw new NotImplementedError(
        `'Shared Components' are not yet supported. Please prepend your modules with '.client.mjs' or '.server.mjs'`
      );
    }
  }

  static renderModule(mod, props) {
    const doc = html`<${mod} ...${props} />`;

    return renderToString(doc);
  }

  resolveOutPath(relPath) {
    const innerSegment = path.relative(
      this.config.directories.input.path,
      relPath
    );
    return path.resolve(
      process.cwd(),
      this.config.directories.output.path,
      innerSegment
    );
  }

  async render(file) {
    file.module = await this.loader.load(file.path);
    file.label = Builder.labelModule(file.name);
    file.rendered = Builder.renderModule(file.module);

    return file;
  }

  *traverse() {
    const { path, options } = this.config.directories.input;
    let files = tree(path, options).children;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type === "directory") {
        files = files.concat(file.children);
      }

      // NOTE: We add `outPath` in `render` as files of any type need to
      // have it.
      file.outPath = this.resolveOutPath(file.path);

      yield file;
    }
  }
}
