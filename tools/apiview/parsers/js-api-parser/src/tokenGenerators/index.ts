import { classTokenGenerator } from "./class";
import { enumTokenGenerator } from "./enum";
import { functionTokenGenerator } from "./function";
import { interfaceTokenGenerator } from "./interface";
import { methodTokenGenerator } from "./method";
import { methodSignatureTokenGenerator } from "./methodSignature";
import { TokenGenerator } from "./interfaces";

export const generators: TokenGenerator[] = [
  functionTokenGenerator,
  methodTokenGenerator,
  methodSignatureTokenGenerator,
  classTokenGenerator,
  interfaceTokenGenerator,
  enumTokenGenerator,
];
