/* eslint-disable @typescript-eslint/no-require-imports */
const D = require("better-sqlite3");
const db = new D("data/aarohan.db");
const [, , key, value] = process.argv;
if (key) {
  db.prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = ?").run(value ?? "", key);
  console.log("updated", key, "->", value);
} else {
  console.log(db.prepare("SELECT setting_key, setting_value FROM site_settings").all());
}
db.close();
