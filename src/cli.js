// @format
const meow = require("meow");
const { init } = require("./configuration.js");

const cli = meow(
  `
Usage: kloi [options]

Options:
	--init, -i	Sets up kloi and creates a config file in the current directory.
`,
  {
    flags: {
      init: {
        type: "boolean",
        alias: "i"
      }
    }
  }
);

async function router(input, flags) {
  if (flags.init) {
    await init();
  }
}

async function run() {
  await router(cli.input, cli.flags);
}

module.exports = { run };
