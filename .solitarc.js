const path = require("path");
const programDir = path.join(__dirname, "programs/royalty_redemptions");
const idlDir = path.join(__dirname, "idl");
const sdkDir = path.join(__dirname, "sdk-repay-royalties", "src", "generated");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "royalty_redemptions",
  programId: "4pV5PQe2AH3r8M9sZ1seMHwhwCyLBdWbaiuWMphXSfaL",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};
