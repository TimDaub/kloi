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
- **["kloi"](http://schwaebisches-woerterbuch.de/default.asp?q=kloi) (schwabian
  for "tiny" or "small")**: kloi has a small and clear code base.
- **ESM support**: [Node
  13.2.0](https://nodejs.medium.com/announcing-core-node-js-support-for-ecmascript-modules-c5d6dc29b663)
  enables ECMAScript modules without flags. kloi is 100% built with ES modules.
- kloi attempts to implement [React Server
  Components](https://github.com/josephsavona/rfcs/blob/server-components/text/0000-server-components.md#capabilities--constraints-of-server-and-client-components).

## Installation

[WIP]

## Usage

### Building Static Pages From A Nested Directory Structure

[See test](./test/readme_test.mjs) for a live run.

**kloi.config.js**
```js
import { build, configuration } from "kloi";
/* NOTE: For internal testing, we run this in a worker_thread currently */
import { parentPort } from "worker_threads";
import { mkdirSync } from "fs";

const config = {
  directories: {
    input: {
      path: "./test/virtual_project/src/pages",
      options: {
        extensions: /\.mjs/,
      },
    },
    output: {
      path: "./test/virtual_project/dist"
    }
  },
};

(async () => {
  await configuration.load(config);
  const outDir = config.directories.output.path;

  const { path, options } = config.directories.input;
  const tree = build.tree(path, options);
  const fileIt = await build.traverse(tree.children);

  const renderedFiles = [];
  let res = await fileIt.next();
  while (!res.done) {
    if (res.value.type === "directory") {
      console.log(res.value);
    } else {
      const rFile = await build.render(res.value);
      renderedFiles.push(rFile);
    }

    res = await fileIt.next();
  }

  console.info(renderedFiles);
  parentPort.postMessage("OK")
})();
```

## Changelog

[WIP]

## License

See [License](./LICENSE).
