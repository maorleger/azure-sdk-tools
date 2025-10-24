import { classTokenGenerator } from "./class";
import { enumTokenGenerator } from "./enum";
import { functionTokenGenerator } from "./function";
import { interfaceTokenGenerator } from "./interface";
import { methodTokenGenerator } from "./method";
import { TokenGenerator } from "./interfaces";

export const generators: TokenGenerator[] = [
  functionTokenGenerator,
  methodTokenGenerator,
  classTokenGenerator,
  interfaceTokenGenerator,
  enumTokenGenerator,
];
