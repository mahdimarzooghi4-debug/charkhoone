"use strict";
// Explicit opt-in dev-only preview: run npm.cmd run preview:web inside apps/mobile.
// Uses installed Expo CLI; no global installs or real OIDC/API credentials required.
const { spawn } = require("node:child_process");
const path = require("node:path");
const mobileDir = path.resolve(__dirname, "..");
const expoCli = path.join(path.dirname(require.resolve("expo/package.json")), "bin", "cli");
const child = spawn(process.execPath, [expoCli, "start", "--web", "--clear"], {
  cwd: mobileDir,
  stdio: "inherit",
  env: { ...process.env, EXPO_PUBLIC_CHARKHOONE_MOCK_PREVIEW: "1" },
});
child.on("error", error => { process.stderr.write(String(error) + "\n"); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
