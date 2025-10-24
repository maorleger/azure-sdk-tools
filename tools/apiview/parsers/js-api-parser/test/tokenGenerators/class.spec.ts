import { describe, expect, it } from "vitest";
import { ApiModel } from "@microsoft/api-extractor-model";
import path from "path";
import { classTokenGenerator } from "../../src/tokenGenerators/class";
import { TokenKind } from "../../src/models";

describe("classTokenGenerator", () => {
  describe("isValidFor", () => {
    it("returns true for class items", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/classes.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      const cls = entryPoint.members.find(m => m.displayName === "SimpleClass")!;

      expect(classTokenGenerator.isValidFor(cls)).toBe(true);
    });
  });

  describe("generate", () => {
    it("generates tokens for simple class", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/classes.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      const cls = entryPoint.members.find(m => m.displayName === "SimpleClass")!;

      const tokens = classTokenGenerator.generate(cls);

      expect(tokens).toEqual([
        { Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "class", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "SimpleClass", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for abstract class", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/classes.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      const cls = entryPoint.members.find(m => m.displayName === "AbstractClass")!;

      const tokens = classTokenGenerator.generate(cls);

      expect(tokens).toEqual([
        { Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "abstract", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "class", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "AbstractClass", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for class with type parameters", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/classes.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      const cls = entryPoint.members.find(m => m.displayName === "ClassWithTypeParams")!;

      const tokens = classTokenGenerator.generate(cls);

      expect(tokens).toEqual([
        { Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "class", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "ClassWithTypeParams", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "<", HasSuffixSpace: false },
        { Kind: TokenKind.TypeName, Value: "T", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ",", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "U", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ">", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for class with extends clause", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/classes.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      const cls = entryPoint.members.find(m => m.displayName === "ClassWithExtends")!;

      const tokens = classTokenGenerator.generate(cls);

      expect(tokens).toEqual([
        { Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "class", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "ClassWithExtends", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "extends", HasSuffixSpace: true },
        { 
          Kind: TokenKind.TypeName, 
          Value: "SimpleClass", 
          HasSuffixSpace: false,
          NavigateToId: "@azure/test-package!SimpleClass:class"
        },
      ]);
    });

    it("generates tokens for class with implements clause", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/classes.json"));
      const pkg = model.packages[0];
      const entryPoint = pkg.entryPoints[0];
      const cls = entryPoint.members.find(m => m.displayName === "ClassWithImplements")!;

      const tokens = classTokenGenerator.generate(cls);

      expect(tokens).toEqual([
        { Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "class", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "ClassWithImplements", HasSuffixSpace: true },
        { Kind: TokenKind.Keyword, Value: "implements", HasSuffixSpace: true },
        { 
          Kind: TokenKind.TypeName, 
          Value: "ITestInterface", 
          HasSuffixSpace: false,
          NavigateToId: "@azure/test-package!ITestInterface:interface"
        },
      ]);
    });
  });
});
