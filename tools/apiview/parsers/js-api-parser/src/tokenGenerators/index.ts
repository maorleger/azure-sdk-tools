import { classTokenGenerator } from "./class";
import { enumTokenGenerator } from "./enum";
import { functionTokenGenerator } from "./function";
import { interfaceTokenGenerator } from "./interface";
import { TokenGenerator } from "./interfaces";

export const generators: TokenGenerator[] = [
  functionTokenGenerator,
  classTokenGenerator,
  interfaceTokenGenerator,
  enumTokenGenerator,
];
