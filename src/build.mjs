// @format
import process from "process";
import path from "path";
import crypto from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";

import { html } from "htm/preact/index.js";
import renderToString from "preact-render-to-string";
import tree from "directory-tree";
import { copySync } from "fs-extra";

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

  copyAssets() {
    const { assets } = this.config.directories.input;
    const assetsPath = path.resolve(process.cwd(), assets.path);
    const outPath = this.resolveOutPath(assetsPath, "directory");
    copySync(assetsPath, outPath, { overwrite: true, errorOnExist: false });
  }

  static renderModule(mod, props) {
    const doc = html`<${mod} ...${props} />`;

    return renderToString(doc);
  }

  resolveOutPath(relPath, type) {
    const { output } = this.config.directories;
    let internalPath = path.relative(
      this.config.directories.input.path,
      relPath
    );

    if (type === "directory") {
      return path.resolve(process.cwd(), output.path, internalPath);
    } else if (type === "file") {
      const extension = ".server.mjs";
      if (!relPath.includes(extension)) {
        throw new NotImplementedError(
          `Cannot resolve path "${relPath}" for file of type: "${type}". At this point, only files of type "file" with the extension "${extension}" can be resolved.`
        );
      }

      const fileName = path.basename(internalPath, extension);
      internalPath = internalPath.replace(fileName + extension, "");

      return path.resolve(
        process.cwd(),
        output.path,
        internalPath,
        fileName + output.extension
      );
    } else {
      throw new NotImplementedError(
        `Cannot resolve path "${relPath}" with type: "${type}"`
      );
    }
  }

  async render(file) {
    file.module = await this.loader.load(file.path);
    file.label = Builder.labelModule(file.name);
    file.rendered = Builder.renderModule(file.module);

    return file;
  }

  write(file) {
    if (!existsSync(this.config.directories.output.path)) {
      throw new Error(
        "Output directory doesn't exist. Please create it first before trying to write files."
      );
    }

    // TODO: If file has label "client" we should throw here
    if (file.type === "directory") {
      mkdirSync(file.outPath);
    } else {
      writeFileSync(file.outPath, file.rendered);
    }
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
      file.outPath = this.resolveOutPath(file.path, file.type);

      yield file;
    }
  }
}
