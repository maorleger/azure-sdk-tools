import { describe, expect, it } from "vitest";
import { ApiModel } from "@microsoft/api-extractor-model";
import path from "path";
import { methodTokenGenerator } from "../../src/tokenGenerators/method";
import { TokenKind } from "../../src/models";

describe("methodTokenGenerator", () => {
  describe("isValidFor", () => {
    it("returns true for method items", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methods.json"));
      const cls = model.packages[0].entryPoints[0].members[0];
      const method = cls.members.find(m => m.displayName === "simpleMethod")!;

      expect(methodTokenGenerator.isValidFor(method)).toBe(true);
    });
  });

  describe("generate", () => {
    it("generates tokens for simple method", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methods.json"));
      const cls = model.packages[0].entryPoints[0].members[0];
      const method = cls.members.find(m => m.displayName === "simpleMethod")!;

      const tokens = methodTokenGenerator.generate(method);

      expect(tokens).toEqual([
        { Kind: TokenKind.MemberName, Value: "simpleMethod", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "(", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ")", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "void", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ";", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for method with parameters", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methods.json"));
      const cls = model.packages[0].entryPoints[0].members[0];
      const method = cls.members.find(m => m.displayName === "methodWithParams")!;

      const tokens = methodTokenGenerator.generate(method);

      expect(tokens).toEqual([
        { Kind: TokenKind.MemberName, Value: "methodWithParams", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "(", HasSuffixSpace: false },
        { Kind: TokenKind.MemberName, Value: "a", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "string", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ",", HasSuffixSpace: true },
        { Kind: TokenKind.MemberName, Value: "b", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "number", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ")", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "boolean", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ";", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for method with type parameters", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methods.json"));
      const cls = model.packages[0].entryPoints[0].members[0];
      const method = cls.members.find(m => m.displayName === "methodWithTypeParams")!;

      const tokens = methodTokenGenerator.generate(method);

      expect(tokens).toEqual([
        { Kind: TokenKind.MemberName, Value: "methodWithTypeParams", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "<", HasSuffixSpace: false },
        { Kind: TokenKind.TypeName, Value: "T", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ">", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "(", HasSuffixSpace: false },
        { Kind: TokenKind.MemberName, Value: "value", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "T", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ")", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "T", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ";", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for static method", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methods.json"));
      const cls = model.packages[0].entryPoints[0].members[0];
      const method = cls.members.find(m => m.displayName === "staticMethod")!;

      const tokens = methodTokenGenerator.generate(method);

      expect(tokens).toEqual([
        { Kind: TokenKind.Keyword, Value: "static", HasSuffixSpace: true },
        { Kind: TokenKind.MemberName, Value: "staticMethod", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "(", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ")", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "string", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ";", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for method with optional parameters", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methods.json"));
      const cls = model.packages[0].entryPoints[0].members[0];
      const method = cls.members.find(m => m.displayName === "optionalParamMethod")!;

      const tokens = methodTokenGenerator.generate(method);

      expect(tokens).toEqual([
        { Kind: TokenKind.MemberName, Value: "optionalParamMethod", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "(", HasSuffixSpace: false },
        { Kind: TokenKind.MemberName, Value: "required", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "string", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ",", HasSuffixSpace: true },
        { Kind: TokenKind.MemberName, Value: "optional", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "?", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "number", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ")", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "void", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ";", HasSuffixSpace: false },
      ]);
    });
  });
});
