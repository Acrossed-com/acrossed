// Tiny shim that emits a CJS entrypoint that re-exports the ESM build.
// Keeps dual-package consumers happy without adding a bundler.
import { writeFileSync } from "node:fs";
const cjs = `"use strict";
module.exports = require("./index.js");
`;
writeFileSync(new URL("../dist/index.cjs", import.meta.url), cjs);
console.log("[cjs-shim] wrote dist/index.cjs");
