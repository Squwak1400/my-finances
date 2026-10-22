// The owner's own details (merchant names, work history) live in Redesign build/personal/, which is never shared.
// Returns that file's export, or null when the folder is missing or the build is a shareable one (--share).
const fs = require("fs"), path = require("path");
module.exports = name => {
  if (process.env.FA_SHARE) return null;
  const f = path.join(__dirname, "personal", name);
  return fs.existsSync(f) ? require(f) : null;
};
