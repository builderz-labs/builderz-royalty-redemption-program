const path = require("path");
const {
  RenderJavaScriptVisitor,
  createFromIdls,
} = require("@metaplex-foundation/kinobi");

// Instanciate Kinobi.
const kinobi = createFromIdls([
  path.join(__dirname, "target/idl", "royalty_redemptions.json"),
]);

// Update the Kinobi tree using visitors...

// Render JavaScript.
const jsDir = path.join(
  __dirname,
  "clients",
  "js",
  "royalty-redemptions",
  "src",
  "generated"
);
kinobi.accept(new RenderJavaScriptVisitor(jsDir));
