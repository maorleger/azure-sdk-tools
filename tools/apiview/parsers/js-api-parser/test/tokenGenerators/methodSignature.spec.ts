import { describe, expect, it } from "vitest";
import { ApiModel } from "@microsoft/api-extractor-model";
import path from "path";
import { methodSignatureTokenGenerator } from "../../src/tokenGenerators/methodSignature";
import { TokenKind } from "../../src/models";

describe("methodSignatureTokenGenerator", () => {
  describe("isValidFor", () => {
    it("returns true for method signature items", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methodSignatures.json"));
      const iface = model.packages[0].entryPoints[0].members[0];
      const methodSig = iface.members.find(m => m.displayName === "simpleMethod")!;

      expect(methodSignatureTokenGenerator.isValidFor(methodSig)).toBe(true);
    });
  });

  describe("generate", () => {
    it("generates tokens for simple method signature", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methodSignatures.json"));
      const iface = model.packages[0].entryPoints[0].members[0];
      const methodSig = iface.members.find(m => m.displayName === "simpleMethod")!;

      const tokens = methodSignatureTokenGenerator.generate(methodSig);

      expect(tokens).toEqual([
        { Kind: TokenKind.MemberName, Value: "simpleMethod", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "(", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ")", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "void", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ";", HasSuffixSpace: false },
      ]);
    });

    it("generates tokens for method signature with parameters", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methodSignatures.json"));
      const iface = model.packages[0].entryPoints[0].members[0];
      const methodSig = iface.members.find(m => m.displayName === "methodWithParams")!;

      const tokens = methodSignatureTokenGenerator.generate(methodSig);

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

    it("generates tokens for method signature with type parameters", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methodSignatures.json"));
      const iface = model.packages[0].entryPoints[0].members[0];
      const methodSig = iface.members.find(m => m.displayName === "methodWithTypeParams")!;

      const tokens = methodSignatureTokenGenerator.generate(methodSig);

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

    it("generates tokens for optional method signature", () => {
      const model = new ApiModel();
      model.loadPackage(path.join(__dirname, "../data/methodSignatures.json"));
      const iface = model.packages[0].entryPoints[0].members[0];
      const methodSig = iface.members.find(m => m.displayName === "optionalMethod")!;

      const tokens = methodSignatureTokenGenerator.generate(methodSig);

      expect(tokens).toEqual([
        { Kind: TokenKind.MemberName, Value: "optionalMethod", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "?", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: "(", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ")", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true },
        { Kind: TokenKind.TypeName, Value: "string", HasSuffixSpace: false },
        { Kind: TokenKind.Punctuation, Value: ";", HasSuffixSpace: false },
      ]);
    });
  });
});
