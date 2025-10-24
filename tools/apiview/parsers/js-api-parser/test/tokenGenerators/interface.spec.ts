import { describe, expect, it } from "vitest";
import { ApiModel } from "@microsoft/api-extractor-model";
import path from "path";
import { interfaceTokenGenerator } from "../../src/tokenGenerators/interface";
import { TokenKind } from "../../src/models";

describe("interfaceTokenGenerator", () => {
  describe("isValidFor", () => {
    it("returns true for interface items", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/interfaces.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      const iface = entryPoint.members[0];

      expect(interfaceTokenGenerator.isValidFor(iface)).toBe(true);
    });
  });

  describe("generate", () => {
    it("generates tokens for simple interface", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/interfaces.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      // API Extractor sorts members alphabetically
      const iface = entryPoint.members.find(m => m.displayName === "SimpleInterface")!;

      const tokens = interfaceTokenGenerator.generate(iface);

      expect(tokens).toEqual([
        { Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "interface", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "SimpleInterface", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for interface with type parameters", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/interfaces.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      const iface = entryPoint.members.find(m => m.displayName === "InterfaceWithTypeParams")!;

      const tokens = interfaceTokenGenerator.generate(iface);

      expect(tokens).toEqual([
        { Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "interface", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "InterfaceWithTypeParams", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "<", HasSuffixSpace: false },
        { Kind: TokenKind.TypeName, Value: "T", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ",", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "U", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ">", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for interface with extends clause", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/interfaces.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      const iface = entryPoint.members.find(m => m.displayName === "InterfaceWithExtends")!;

      const tokens = interfaceTokenGenerator.generate(iface);

      expect(tokens).toEqual([
        { Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "interface", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "InterfaceWithExtends", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "extends", HasSuffixSpace: true },
        { 
          Kind: TokenKind.TypeName, 
          Value: "SimpleInterface", 
          HasSuffixSpace: false,
          NavigateToId: "@azure/test-package!SimpleInterface:interface"
        },
      ]);
    });
  });
});
