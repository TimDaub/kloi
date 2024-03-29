# kloi

![Node.js CI](https://github.com/TimDaub/kloi/workflows/Node.js%20CI/badge.svg)

> kloi is a tiny toolkit for building simple static sites.

## Requirements

- for node version, see [package.json](./package.json)

## Why use kloi?

- **Explicit is better than implicit**: Projects built with kloi contain no
  hidden or inaccessible configurations. kloi is a static page generator turned
  inside-out. It's not a binary but a toolkit to build your own static site
  generator. All static pages you write are plain & valid JavaScript.
- **"[kloi](http://schwaebisches-woerterbuch.de/default.asp?q=kloi)" (schwabian
  for "tiny" or "small")**: kloi has a small and clear code base.
- **ESM support**: [Node
  13.2.0](https://nodejs.medium.com/announcing-core-node-js-support-for-ecmascript-modules-c5d6dc29b663)
  enables ECMAScript modules without flags. kloi is 100% built with ES modules.
- kloi attempts to implement [React Server
  Components](https://github.com/josephsavona/rfcs/blob/server-components/text/0000-server-components.md#capabilities--constraints-of-server-and-client-components).

## Installation

```bash
$ npm i --save-dev kloi
```

Check the "Usage" section below for getting started.

## Usage

### Building Static Pages From A Nested Directory Structure

[See test](./test/readme_test.mjs) for a live run. Or the
[`kloi-sample-project`](https://github.com/TimDaub/kloi-sample-project) for a
template repository.

**kloi.config.js**
```js
import { Builder, configuration } from "kloi";
import { parentPort } from "worker_threads"; /* IGNORE AND DELETE */

let config = {
  directories: {
    input: {
      path: "./test/virtual_project/src/pages",
      options: {
        extensions: /\.mjs/,
      },
      images: {
        input: "./src/images/*.{jpg,png}",
        output: "./dist/images"
      },
      assets: {
        path: "./test/virtual_project/src/pages/assets/",
      },
    },
    output: {
      path: "./test/virtual_project/dist",
      extension: ".html"
    }
  },
};

(async () => {
  config = await configuration.load(config);
  const builder = new Builder(config);
  const iterator = builder.traverse();

  let head = iterator.next();
  while (!head.done) {
    let file = head.value;

    if (file.type === "file") {
      file = await builder.render(file);
    }

    builder.write(file);
    head = iterator.next();
  }

  builder.copyAssets();

  parentPort.postMessage("success") /* IGNORE AND DELETE */
})();
```

#### Limitations

- `config.directories.input.assets.path` must be a subdir of
  `config.directories.input.path`.

## Changelog

### 0.2.0

- Breaking change: `traverse` now throws when `directories.input.path` is
  empty.
- `directories.input.images` can point to a folder of images (`.png` and
  `.jpg`) that will be web-optimized using
  [imagemin](https://github.com/imagemin/imagemin).


### 0.1.0

- breaking change: `new Builder(config).write(file)` isn't throwing anymore
  if `file.type === "directory"` and the path at `file.outPath` already
  exists.

### 0.0.2

- Add `copyAssets` function and `config.directories.input.assets.path` (in
  config.mjs), allow users to define a static assets directory structure that
  is copied to the output path.

### 0.0.1

- Initial release of kloi. It can render a directory tree of `*.server.mjs`
  files to a directory tree of `*.html` files using preact.

## License

See [License](./LICENSE).
