import { ApiFunction, ApiItem, ApiItemKind } from "@microsoft/api-extractor-model";
import { ReviewToken, TokenKind } from "../models";
import { buildToken } from "../jstokens";
import { TokenGenerator } from "./interfaces";

function isValidFor(item: ApiItem): item is ApiFunction {
  return item.kind === ApiItemKind.Function;
}

function generate(item: ApiFunction): ReviewToken[] {
  const tokens: ReviewToken[] = [];
  if (item.kind !== ApiItemKind.Function) {
    throw new Error(
      `Invalid item ${item.displayName} of kind ${item.kind} passed to function token generator`,
    );
  }

  tokens.push({ Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true });
  tokens.push({ Kind: TokenKind.Keyword, Value: "function", HasSuffixSpace: true });

  // Understands type parameters
  tokens.push({ Kind: TokenKind.Text, Value: item.displayName, HasSuffixSpace: false });
  if (item.typeParameters.length > 0) {
    tokens.push({ Kind: TokenKind.Punctuation, Value: "<" });
    item.typeParameters.forEach((typeParam, i) => {
      if (i > 0) {
        tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ",", HasSuffixSpace: true }));
      }
      tokens.push(buildToken({ Kind: TokenKind.TypeName, Value: typeParam.name }));
    });
    tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ">" }));
  }

  tokens.push({ Kind: TokenKind.Punctuation, Value: "(" });
  item.parameters.forEach((param, i) => {
    if (i > 0) {
      tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: "," }));
    }
    tokens.push(buildToken({ Kind: TokenKind.MemberName, Value: param.name }));
    // Understands optional properties, etc
    if (param.isOptional) {
      tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: "?" }));
    }
    tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true }));
    tokens.push({ Kind: TokenKind.TypeName, Value: param.parameterTypeExcerpt.text });
  });

  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ")" }));
  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ":" }));
  tokens.push({ Kind: TokenKind.TypeName, Value: item.returnTypeExcerpt.text });
  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ";" }));

  return tokens;
}

export const functionTokenGenerator: TokenGenerator = {
  isValidFor,
  generate,
};
