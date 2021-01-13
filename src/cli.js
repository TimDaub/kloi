// @format
const meow = require("meow");
const { init } = require("./configuration.js");
const { build } = require("./build.js");

const cli = meow(
  `
Usage: kloi [options]

Options:
	--init, -i	  Sets up kloi and creates a config file in the current directory.
  --build, -b   Builds the project.
`,
  {
    flags: {
      init: {
        type: "boolean",
        alias: "i"
      },
      build: {
        type: "boolean",
        alias: "b"
      }
    }
  }
);

async function router(input, flags) {
  if (flags.init) {
    await init();
  } else if (flags.build) {
    await build();
  }
}

async function run() {
  await router(cli.input, cli.flags);
}

module.exports = { run };
