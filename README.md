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

[WIP]

## Usage

### Building Static Pages From A Nested Directory Structure

[See test](./test/readme_test.mjs) for a live run.

**kloi.config.js**
```js
import { Builder, configuration } from "kloi";
/* IGNORE: For internal testing */
import { parentPort } from "worker_threads";

let config = {
  directories: {
    input: {
      path: "./test/virtual_project/src/pages",
      options: {
        extensions: /\.mjs/,
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

  /* IGNORE: For internal testing */
  parentPort.postMessage("success")
})();
```

## Changelog

[WIP]

## License

See [License](./LICENSE).
