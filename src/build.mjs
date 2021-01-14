import path from "path";
import { readdirSync } from "fs";

import { loadConfig } from "./configuration.mjs";

export function createTree(directories) {
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
export function loadModules(tree, projectPath) {
    for (const [dirName, content] of Object.entries(tree)) {
        for (const [fileName, props] of Object.entries(content)) {
            const modulePath = path.resolve(projectPath, `${dirName}/${fileName}`);
            //const module = require(modulePath);
            const module = "fake";
            tree[dirName][fileName] = { ...props, module };
        }
    }
    return tree;
}
export function build() {
    const config = loadConfig();
    let dirTree = createTree(config.directories);
    dirTree = loadModules(dirTree, config.PROJECT_DIR);
    console.log(dirTree);
}
