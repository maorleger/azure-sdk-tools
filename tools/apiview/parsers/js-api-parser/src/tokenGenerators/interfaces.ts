import { ApiItem } from "@microsoft/api-extractor-model";
import { ReviewToken } from "../models";

/**
 * Interface for generating review tokens from API items.
 */
export interface TokenGenerator {
  /**
   * Checks if the given generator can generate ReviewTokens for this item.
   * @param item - The API item to check.
   * @returns True if the item can be processed via this generator.
   */
  isValidFor(item: ApiItem): boolean;

  /**
   * Generates an array of review tokens from the given API item.
   * @param item - The API item to generate tokens from.
   * @returns An array of review tokens.
   */
  generate(item: ApiItem): ReviewToken[];
}
