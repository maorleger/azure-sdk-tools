const { ApiModel } = require("@microsoft/api-extractor-model");
const path = require("path");

const files = [
  { name: "@azure/core-auth", path: "../test/data/real-world-core-auth.api.json" },
  { name: "@azure/core-client", path: "../test/data/real-world-core-client.api.json" },
];

for (const file of files) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Analyzing ${file.name}...`);
  console.log("=".repeat(60));

  const model = new ApiModel();
  model.loadPackage(path.join(__dirname, file.path));

  let totalItems = 0;
  let itemsByKind = {};

  function countItems(item) {
    totalItems++;
    const kind = item.kind;
    itemsByKind[kind] = (itemsByKind[kind] || 0) + 1;
    
    if (item.members) {
      for (const member of item.members) {
        countItems(member);
      }
    }
  }

  const pkg = model.packages[0];
  for (const entryPoint of pkg.entryPoints) {
    countItems(entryPoint);
  }

  console.log("\nTotal API items:", totalItems);
  console.log("\nBreakdown by kind:");
  const sorted = Object.entries(itemsByKind).sort((a, b) => b[1] - a[1]);
  for (const [kind, count] of sorted) {
    console.log(`  ${kind}: ${count}`);
  }

  const withGenerators = ["Function", "Enum", "Interface", "Class", "Method", "MethodSignature"];
  const covered = sorted.filter(([k]) => withGenerators.includes(k));
  const notCovered = sorted.filter(([k]) => !withGenerators.includes(k) && k !== "EntryPoint" && k !== "Package");

  const coveredCount = covered.reduce((sum, [, count]) => sum + count, 0);
  const notCoveredCount = notCovered.reduce((sum, [, count]) => sum + count, 0);
  const excludedCount = (itemsByKind["EntryPoint"] || 0) + (itemsByKind["Package"] || 0);

  const percentage = Math.round(coveredCount/(totalItems - excludedCount)*100);
  console.log(`\n✅ With semantic generators: ${coveredCount}/${totalItems - excludedCount} (${percentage}%)`);
  console.log(`⏳ Using fallback: ${notCoveredCount}/${totalItems - excludedCount} (${100-percentage}%)`);
  console.log(`\nItems needing generators (P1/P2):`);
  for (const [kind, count] of notCovered) {
    console.log(`  - ${kind}: ${count}`);
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log("Summary");
console.log("=".repeat(60));
console.log("\n✅ Implemented (P0): Function, Enum, Interface, Class, Method, MethodSignature");
console.log("\n⏳ Remaining:");
console.log("  P1: PropertySignature, Property, TypeAlias, Variable, Constructor, EnumMember");
console.log("  P2: Namespace, CallSignature, ConstructSignature, IndexSignature");
