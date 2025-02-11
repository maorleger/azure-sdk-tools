import { enumTokenGenerator } from "./enum";
import { functionTokenGenerator } from "./function";
import { TokenGenerator } from "./interfaces";

export const generators: TokenGenerator[] = [functionTokenGenerator, enumTokenGenerator];
