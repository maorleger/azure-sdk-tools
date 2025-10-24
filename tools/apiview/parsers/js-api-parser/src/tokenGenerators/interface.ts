import { ApiInterface, ApiItem, ApiItemKind } from "@microsoft/api-extractor-model";
import { ReviewToken, TokenKind } from "../models";
import { buildToken } from "../jstokens";
import { TokenGenerator } from "./interfaces";

function isValidFor(item: ApiItem): item is ApiInterface {
  return item.kind === ApiItemKind.Interface;
}

function generate(item: ApiInterface): ReviewToken[] {
  const tokens: ReviewToken[] = [];
  
  if (item.kind !== ApiItemKind.Interface) {
    throw new Error(
      `Invalid item ${item.displayName} of kind ${item.kind} passed to interface generator`,
    );
  }

  // export interface
  tokens.push(buildToken({ Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true }));
  tokens.push(buildToken({ Kind: TokenKind.Keyword, Value: "interface", HasSuffixSpace: true }));
  
  // Name
  tokens.push(buildToken({ Kind: TokenKind.TypeName, Value: item.displayName }));

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

  // Extends clause
  if (item.extendsTypes && item.extendsTypes.length > 0) {
    // Add space before extends
    if (tokens.length > 0) {
      tokens[tokens.length - 1].HasSuffixSpace = true;
    }
    tokens.push(buildToken({ Kind: TokenKind.Keyword, Value: "extends", HasSuffixSpace: true }));
    
    item.extendsTypes.forEach((extendsType, i) => {
      if (i > 0) {
        tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ",", HasSuffixSpace: true }));
      }
      
      // Extract tokens from the heritage type excerpt
      extendsType.excerpt.spannedTokens.forEach((token) => {
        if (token.kind === "Reference" && token.canonicalReference) {
          tokens.push(buildToken({
            Kind: TokenKind.TypeName,
            Value: token.text,
            NavigateToId: token.canonicalReference.toString(),
          }));
        } else if (token.text && token.text.trim()) {
          // For non-reference parts, add as TypeName (skip pure whitespace)
          const trimmed = token.text.trim();
          if (trimmed) {
            tokens.push(buildToken({ Kind: TokenKind.TypeName, Value: trimmed }));
          }
        }
      });
    });
  }

  return tokens;
}

export const interfaceTokenGenerator: TokenGenerator = {
  isValidFor,
  generate,
};
