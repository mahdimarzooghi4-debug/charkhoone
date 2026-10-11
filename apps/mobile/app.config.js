const fs = require("node:fs");
const path = require("node:path");

module.exports = ({ config }) => {
  const appDir = __dirname;
  const iconSource = path.resolve(appDir, "../web/src/app/icon.svg");
  const svg = fs.readFileSync(iconSource, "utf8");
  const match = svg.match(/href="data:image\/png;base64,([^"]+)"/);
  if (!match) throw new Error("Could not read the Charkhoone icon embedded in apps/web/src/app/icon.svg");

  const icon = Buffer.from(match[1], "base64");
  const writeAsset = (relativePath) => {
    const target = path.join(appDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, icon);
  };

  // Keep native app, browser tab, iOS home screen, and installed web app on one brand mark.
  writeAsset("assets/charkhoone-app-icon.png");
  writeAsset("public/charkhoone-icon.png");
  writeAsset("public/apple-touch-icon.png");

  return config;
};
