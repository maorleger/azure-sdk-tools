import { ApiEnum, ApiItem, ApiItemKind } from "@microsoft/api-extractor-model";
import { ReviewToken, TokenKind } from "../models";
import { buildToken } from "../jstokens";
import { TokenGenerator } from "./interfaces";

function isValidFor(item: ApiItem): item is ApiEnum {
  return item.kind === ApiItemKind.Enum;
}

function generate(item: ApiEnum): ReviewToken[] {
  const tokens: ReviewToken[] = [];
  if (item.kind !== ApiItemKind.Enum) {
    throw new Error(
      `Invalid item ${item.displayName} of kind ${item.kind} passed to enum generator`,
    );
  }

  tokens.push({ Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true });
  tokens.push({ Kind: TokenKind.Keyword, Value: "enum", HasSuffixSpace: true });
  tokens.push({ Kind: TokenKind.MemberName, Value: item.displayName });

  return tokens;
}

export const enumTokenGenerator: TokenGenerator = {
  isValidFor,
  generate,
};
