// @format

const path = require("path");
const { readdirSync } = require("fs");
const { loadConfig } = require("./configuration.js");
const esmRequire = require("esm")(module);

// TODO: Test all of this
function createTree(directories) {
  let tree = {};
  for (const [name, dir] of Object.entries(directories)) {
    const files = readdirSync(dir);
    for (const name of files) {
      tree[dir] = {
        [name]: {}
      };
    }
  }

  return tree;
}

function loadModules(tree, projectPath) {
  for (const [dirName, content] of Object.entries(tree)) {
    for (const [fileName, props] of Object.entries(content)) {
      const modulePath = path.resolve(projectPath, `${dirName}/${fileName}`);
      const module = esmRequire(modulePath);
      tree[dirName][fileName] = { ...props, module };
    }
  }

  return tree;
}

function build() {
  const config = loadConfig();

  let dirTree = createTree(config.directories);
  dirTree = loadModules(dirTree, config.PROJECT_DIR);
  console.log(dirTree);
}

module.exports = { build };
