import { describe, expect, it } from "vitest";
import { ApiModel } from "@microsoft/api-extractor-model";
import path from "path";
import { generateApiview } from "../src/generate";

describe("Real-world Integration Tests", () => {
  describe("@azure/core-auth", () => {
    it("successfully generates API view without errors", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "./data/real-world-core-auth.api.json"));

      const result = generateApiview({
        apiModel: model,
        dependencies: {},
        meta: {
          Name: "@azure/core-auth",
          PackageName: "@azure/core-auth",
          PackageVersion: "1.0.0",
          ParserVersion: "2.0.0",
          Language: "JavaScript",
        },
      });

      // Basic smoke tests
      expect(result).toBeDefined();
      expect(result.ReviewLines).toBeDefined();
      expect(result.ReviewLines.length).toBeGreaterThan(0);
      
      // Check that we have some content
      const hasTokens = result.ReviewLines.some(line => 
        line.Tokens && line.Tokens.length > 0
      );
      expect(hasTokens).toBe(true);

      // Log statistics
      const totalLines = result.ReviewLines.length;
      const linesWithTokens = result.ReviewLines.filter(l => l.Tokens && l.Tokens.length > 0).length;
      console.log(`@azure/core-auth: ${totalLines} total lines, ${linesWithTokens} with tokens`);
    });
  });

  describe("@azure/core-client", () => {
    it("successfully generates API view without errors", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "./data/real-world-core-client.api.json"));

      const result = generateApiview({
        apiModel: model,
        dependencies: {},
        meta: {
          Name: "@azure/core-client",
          PackageName: "@azure/core-client",
          PackageVersion: "1.0.0",
          ParserVersion: "2.0.0",
          Language: "JavaScript",
        },
      });

      // Basic smoke tests
      expect(result).toBeDefined();
      expect(result.ReviewLines).toBeDefined();
      expect(result.ReviewLines.length).toBeGreaterThan(0);
      
      // Check that we have some content
      const hasTokens = result.ReviewLines.some(line => 
        line.Tokens && line.Tokens.length > 0
      );
      expect(hasTokens).toBe(true);

      // Log statistics
      const totalLines = result.ReviewLines.length;
      const linesWithTokens = result.ReviewLines.filter(l => l.Tokens && l.Tokens.length > 0).length;
      console.log(`@azure/core-client: ${totalLines} total lines, ${linesWithTokens} with tokens`);
    });
  });

  describe("Generator Coverage Analysis", () => {
    it("reports which API items are using semantic generators vs fallback", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "./data/real-world-core-auth.api.json"));

      // Count API item kinds
      const itemCounts = new Map<string, number>();
      
      function countItems(items: any[]) {
        for (const item of items) {
          const kind = item.kind;
          itemCounts.set(kind, (itemCounts.get(kind) || 0) + 1);
          
          if (item.members) {
            countItems(item.members);
          }
        }
      }

      const pkg = model.packages[0];
      countItems(pkg.entryPoints);

      console.log("\nAPI Item Distribution in @azure/core-auth:");
      for (const [kind, count] of Array.from(itemCounts.entries()).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${kind}: ${count}`);
      }

      // Report which have generators
      const withGenerators = [
        "Function", "Enum", "Interface", "Class", "Method", "MethodSignature"
      ];
      const withoutGenerators = Array.from(itemCounts.keys()).filter(k => !withGenerators.includes(k));
      
      console.log("\n✅ Items with semantic generators:", withGenerators.join(", "));
      console.log("⏳ Items still using fallback:", withoutGenerators.join(", ") || "None!");
    });
  });
});
