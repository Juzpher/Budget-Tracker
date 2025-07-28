const fs = require("fs");
const path = require("path");

// Copy Prisma engine for rhel-openssl
const engineSrc = path.join(
  __dirname,
  "../node_modules/@prisma/engines/libquery_engine-rhel-openssl-3.0.x.so.node"
);

const engineDest = path.join(
  __dirname,
  "../lib/generated/prisma/libquery_engine-rhel-openssl-3.0.x.so.node"
);

// Create destination directory if it doesn't exist
if (!fs.existsSync(path.dirname(engineDest))) {
  fs.mkdirSync(path.dirname(engineDest), { recursive: true });
}

// Copy the file
fs.copyFileSync(engineSrc, engineDest);
console.log("Prisma engine copied successfully!");
