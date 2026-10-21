/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(process.cwd(), "data");
if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log("Removed", dataDir);
} else {
  console.log("Nothing to remove — data directory does not exist.");
}
console.log("Run `npm run seed` or start the app to recreate a fresh seeded database.");
