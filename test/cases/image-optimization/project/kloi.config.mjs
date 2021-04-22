// @format
import { Builder, configuration } from "../../../../src/index.mjs";
import process from "process";
import path from "path";
import { fileURLToPath } from "url";

let config = {
  directories: {
    input: {
      path: "./src",
      options: {
        extensions: /\.mjs/
      },
      images: {
        input: "./src/images/*.{jpg,png}",
        output: "./dist/images"
      },
      assets: {
        path: "./src/assets"
      }
    },
    output: {
      path: "./dist",
      extension: ".html"
    }
  }
};

async function run() {
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

  await builder.copyAssets();
}

run();
