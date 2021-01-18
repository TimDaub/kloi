# kloi

![Node.js CI](https://github.com/TimDaub/kloi/workflows/Node.js%20CI/badge.svg)

> kloi is a tiny toolkit for building simple static sites. It implements [React Server Components](https://github.com/josephsavona/rfcs/blob/server-components/text/0000-server-components.md#capabilities--constraints-of-server-and-client-components).

## Requirements

- node version `>= 13.2.0` (ESM)

## Principles

- **Explicit is better than implicit**: Projects built with kloi contain no
  hidden or inaccessible configurations.  All static pages you write are valid
  JavaScript.
- **["kloi"](http://schwaebisches-woerterbuch.de/default.asp?q=kloi) (schwabian
  for "tiny" or "small")**: kloi has a small and clear code base.
- **ESM support**: [Node
  13.2.0](https://nodejs.medium.com/announcing-core-node-js-support-for-ecmascript-modules-c5d6dc29b663)
  enables ECMAScript modules without flags. kloi is 100% built with ES modules.

## Installation

[WIP]

## Usage

### Building Static Pages From A Nested Directory Structure

**kloi.config.js**
```js
import { build, configuration } from "kloi";
import { resolve } from "path";
/* NOTE: For internal testing, we run this in a worker_thread currently */
import { parentPort } from "worker_threads";

const config = {
  directories: {
    pages: {
      path: './test/virtual_project/src/pages',
      options: {
        extensions: /\.mjs/,
      },
    },
  },
};

(async () => {
  await configuration.validateConfig(config);
  const { path, options } = config.directories.pages;

  const tree = build.tree(path, options);
  const fileIt = await build.traverse(tree.children);

  let res = await fileIt.next();
  while (!res.done) {
    res.value = await build.load(res.value);
    res = await fileIt.next();
  }

  console.log(tree);
  parentPort.postMessage("OK")
})();
```

## Changelog

[WIP]

## License

See [License](./LICENSE).
