import { ApiMethod, ApiItem, ApiItemKind } from "@microsoft/api-extractor-model";
import { ReviewToken, TokenKind } from "../models";
import { buildToken } from "../jstokens";
import { TokenGenerator } from "./interfaces";

function isValidFor(item: ApiItem): item is ApiMethod {
  return item.kind === ApiItemKind.Method;
}

function generate(item: ApiMethod): ReviewToken[] {
  const tokens: ReviewToken[] = [];
  
  if (item.kind !== ApiItemKind.Method) {
    throw new Error(
      `Invalid item ${item.displayName} of kind ${item.kind} passed to method generator`,
    );
  }

  // static modifier (if applicable)
  if (item.isStatic) {
    tokens.push(buildToken({ Kind: TokenKind.Keyword, Value: "static", HasSuffixSpace: true }));
  }

  // Method name
  tokens.push(buildToken({ Kind: TokenKind.MemberName, Value: item.displayName }));

  // Type parameters
  if (item.typeParameters && item.typeParameters.length > 0) {
    tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: "<" }));
    item.typeParameters.forEach((typeParam, i) => {
      if (i > 0) {
        tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ",", HasSuffixSpace: true }));
      }
      tokens.push(buildToken({ Kind: TokenKind.TypeName, Value: typeParam.name }));
    });
    tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ">" }));
  }

  // Parameters
  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: "(" }));
  
  if (item.parameters && item.parameters.length > 0) {
    item.parameters.forEach((param, i) => {
      if (i > 0) {
        tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ",", HasSuffixSpace: true }));
      }
      
      // Parameter name
      tokens.push(buildToken({ Kind: TokenKind.MemberName, Value: param.name }));
      
      // Optional marker
      if (param.isOptional) {
        tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: "?" }));
      }
      
      // Type annotation
      tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true }));
      
      // Parameter type
      tokens.push(buildToken({ Kind: TokenKind.TypeName, Value: param.parameterTypeExcerpt.text }));
    });
  }
  
  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ")" }));

  // Return type
  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ":", HasSuffixSpace: true }));
  tokens.push(buildToken({ Kind: TokenKind.TypeName, Value: item.returnTypeExcerpt.text }));

  // Semicolon
  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ";" }));

  return tokens;
}

export const methodTokenGenerator: TokenGenerator = {
  isValidFor,
  generate,
};
