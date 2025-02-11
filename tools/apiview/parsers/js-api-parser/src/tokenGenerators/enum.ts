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
      `Invalid item ${item.displayName} of kind ${item.kind} passed to function serializer`,
    );
  }

  tokens.push({ Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true });
  tokens.push({ Kind: TokenKind.Keyword, Value: "enum", HasSuffixSpace: true });

  tokens.push({ Kind: TokenKind.MemberName, Value: item.displayName });
  tokens.push({ Kind: TokenKind.Punctuation, Value: "{" });

  item.members.forEach((member, i) => {
    if (i > 0) {
      tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: "," }));
    }
    tokens.push(buildToken({ Kind: TokenKind.MemberName, Value: member.name }));
  });

  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: "}" }));

  return tokens;
}

export const enumTokenGenerator: TokenGenerator = {
  isValidFor,
  generate,
};
