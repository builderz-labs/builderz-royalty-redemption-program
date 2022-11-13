const path = require('path');
const programDir = path.join(__dirname, 'programs/repay_royalties_contract');
const idlDir = path.join(__dirname, 'idl');
const sdkDir = path.join(__dirname, 'src', 'generated');
const binaryInstallDir = path.join(__dirname, '.crates');

module.exports = {
  idlGenerator: 'anchor',
  programName: 'repay_royalties_contract',
  programId: '9ZskGH9wtdwM9UXjBq1KDwuaLfrZyPChz41Hx7NWhTFf',
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};