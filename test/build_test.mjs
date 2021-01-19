// @format
import path from "path";
import { fileURLToPath } from "url";
import {
  existsSync,
  unlinkSync,
  writeFileSync,
  mkdirSync,
  rmdirSync
} from "fs";
import ava from "ava";
import { Component } from "preact";
import { html } from "htm/preact/index.js";

import { labelModule, renderModule } from "../src/build.mjs";

const test = ava.serial;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_FOLDER = path.resolve(__dirname, "./virtual_project");

test.afterEach.always(t => {
  rmdirSync(TEST_FOLDER, { recursive: true });
  mkdirSync(TEST_FOLDER);
  writeFileSync(`${TEST_FOLDER}/.keep`, "");
});

test("if matching react server and client components is possible", async t => {
  t.deepEqual(labelModule({ name: "index.server.js" }), {
    label: "server",
    name: "index.server.js"
  });
  t.deepEqual(labelModule({ name: "index.client.js" }), {
    label: "client",
    name: "index.client.js"
  });
  t.throws(() => labelModule({ name: "index.bla.js" }));
  t.throws(() => labelModule({ name: "index.js" }));
});

test("rendering a valid preact class and fn component with props", async t => {
  function FnComponent(props) {
    return html`${props.msg}`;
  }

  class Test extends Component {
    render() {
      return html`
        <span>
          <${FnComponent} ...${this.props} />
        </span>`;
    }
  }

  const msg = "hello";
  const out = await renderModule({ module: Test }, { msg });
  t.is(out.render, `<span>${msg}</span>`);
});
