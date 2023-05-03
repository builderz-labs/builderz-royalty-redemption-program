const path = require("path");
const {
  RenderJavaScriptVisitor,
  createFromIdls,
} = require("@metaplex-foundation/kinobi");

// Instanciate Kinobi.
const kinobi = createFromIdls([
  path.join(__dirname, "idl", "repay_royalties_contract.json"),
]);

// Update the Kinobi tree using visitors...

// Render JavaScript.
const jsDir = path.join(__dirname, "clients", "js", "src", "generated");
kinobi.accept(new RenderJavaScriptVisitor(jsDir));
