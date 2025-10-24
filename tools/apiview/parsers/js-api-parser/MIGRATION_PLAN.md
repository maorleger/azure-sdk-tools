# Migration Plan: Semantic Token Generators

## Executive Summary

This document outlines a comprehensive plan to migrate the JavaScript/TypeScript API parser from string-based token generation to semantic, structure-aware token generators. The goal is to eliminate brittle text parsing in favor of type-safe, maintainable generators that work directly with the `@microsoft/api-extractor-model` API structure.

## Current State Analysis

### Architecture Overview

The current parser (`src/generate.ts` and `src/jstokens.ts`) uses a **string-based parsing approach**:

1. **Input**: API Extractor JSON files containing `ApiItem` objects with `excerptTokens`
2. **Processing**: Extract text from `excerptTokens` and parse with `js-tokens` library
3. **Output**: Generate `ReviewToken[]` arrays for APIView rendering

### Current Approach: String-Based Parsing

**Main Flow** (`buildMemberLineTokens` in `generate.ts`):
```typescript
if (item instanceof ApiDeclaredItem) {
  if (item.kind === ApiItemKind.Namespace) {
    splitAndBuild(line.Tokens, `declare namespace ${item.displayName} `, item);
  } else if (item.kind === ApiItemKind.Variable) {
    // Manual token building
  } else {
    // Extract excerpt tokens as strings
    for (const excerpt of item.excerptTokens) {
      if (excerpt.kind === ExcerptTokenKind.Reference) {
        // Build type reference token
      } else {
        // Parse string with splitAndBuild()
      }
    }
  }
}
```

**String Parsing** (`splitAndBuild` in `jstokens.ts`):
- Takes a string of TypeScript code
- Uses regex replacements (e.g., `export declare function` → `export function`)
- Tokenizes with `js-tokens` library
- Applies heuristics to categorize tokens (keywords, types, punctuation)
- Tries to infer semantics from string matching

### Problems with Current Approach

1. **Fragile**: String manipulation and regex replacements are error-prone
2. **Limited Semantic Understanding**: Cannot properly handle:
   - Type parameters (generic constraints, variance)
   - Optional/rest parameters
   - Complex type expressions
   - Re-exported items (different names in excerpt vs actual)
3. **Heuristic-Based**: Uses string matching to guess token types
4. **Hard to Test**: Testing requires full string fixtures
5. **Hard to Extend**: Adding support for new constructs requires modifying core parsing logic
6. **Special Cases**: Accumulates workarounds (see enum handling in current code)

## API Extractor Model Structure

### Core Types Available

From `@microsoft/api-extractor-model` (v7.29.8):

**Base Classes**:
- `ApiItem` - Base class for all API items
- `ApiDeclaredItem` - Items with excerpt tokens
- `ApiDocumentedItem` - Items with TSDoc comments
- `ApiNamedItem` - Items with names
- `ApiReleaseTagMixin` - Items with release tags (@alpha, @beta, @public)

**Specific API Item Classes** (correspond to `ApiItemKind`):
- `ApiClass` - Classes
- `ApiEnum` - Enums  
- `ApiEnumMember` - Enum members
- `ApiFunction` - Module-level functions
- `ApiInterface` - Interfaces
- `ApiNamespace` - Namespaces
- `ApiTypeAlias` - Type aliases
- `ApiVariable` - Variables (usually exported constants)
- `ApiProperty` - Class/interface properties
- `ApiPropertySignature` - Interface property signatures
- `ApiMethod` - Class methods
- `ApiMethodSignature` - Interface method signatures
- `ApiConstructor` - Class constructors
- `ApiCallSignature` - Call signatures
- `ApiConstructSignature` - Construct signatures
- `ApiIndexSignature` - Index signatures

**Key Properties/Methods**:
- `item.displayName` - The name shown in source
- `item.canonicalReference` - Unique identifier
- `item.excerptTokens` - Raw text tokens (fallback)
- `item.parameters` - For callable items (functions, methods)
- `item.typeParameters` - Generic type parameters
- `item.returnTypeExcerpt` - Return type
- `item.members` - Child items (for containers)
- `item.tsdocComment` - Documentation

## API Item Categories and Handling

### Category 1: Top-Level Declarations (Need Generators)

These are exported from modules and have complex semantics:

| ApiItemKind | Current Handling | Complexity | Priority |
|-------------|------------------|------------|----------|
| `Function` | String parsing (excerpt tokens) | **High** - type params, overloads, optional params | P0 |
| `Class` | String parsing (excerpt tokens) | **High** - inheritance, type params, abstract, implements | P0 |
| `Interface` | String parsing (excerpt tokens) | **High** - extends, type params | P0 |
| `Enum` | Partial semantic (prototype) | **Medium** - members, const enums, re-exports | P0 |
| `TypeAlias` | String parsing (excerpt tokens) | **Medium** - type params, complex types | P1 |
| `Variable` | Manual keyword injection + string parsing | **Low** - simple const declarations | P1 |
| `Namespace` | Manual string template | **Low** - just declaration | P2 |

### Category 2: Type Members (Need Generators)

These are children of classes/interfaces:

| ApiItemKind | Current Handling | Complexity | Priority |
|-------------|------------------|------------|----------|
| `Method` | String parsing | **High** - overloads, type params, access modifiers | P0 |
| `MethodSignature` | String parsing | **High** - overloads, type params, optional | P0 |
| `Property` | String parsing | **Medium** - modifiers, optional, readonly | P1 |
| `PropertySignature` | String parsing | **Medium** - optional, readonly | P1 |
| `Constructor` | String parsing | **High** - overloads, parameters | P1 |
| `CallSignature` | String parsing | **Medium** - function types | P2 |
| `ConstructSignature` | String parsing | **Medium** - constructor types | P2 |
| `IndexSignature` | String parsing | **Low** - `[key: string]: Type` | P2 |
| `EnumMember` | String parsing | **Low** - name and optional value | P1 |

### Category 3: Structural (May Not Need Generators)

| ApiItemKind | Handling | Notes |
|-------------|----------|-------|
| `Package` | Metadata only | Container for entry points |
| `EntryPoint` | Metadata only | Subpath exports container |
| `Model` | Container | Top-level container |
| `None` | N/A | Shouldn't appear |

## Prototype Analysis

### What the Prototype Demonstrates

The `semantic-generators` branch includes:

**1. Generator Interface** (`src/tokenGenerators/interfaces.ts`):
```typescript
interface TokenGenerator {
  isValidFor(item: ApiItem): boolean;
  generate(item: ApiItem): ReviewToken[];
}
```

**2. Function Generator** (`src/tokenGenerators/function.ts`):
- Directly accesses `item.typeParameters`, `item.parameters`, `item.returnTypeExcerpt`
- Correctly handles optional parameters with `?` syntax
- Builds tokens programmatically instead of parsing strings
- Type-safe with `item is ApiFunction` guard

**3. Enum Generator** (`src/tokenGenerators/enum.ts`):
- Fixes re-export bug where `excerptTokens` contain wrong name
- Uses `item.displayName` and `item.members` directly
- Simple, correct implementation

**4. Integration Point** (`src/generate.ts`):
```typescript
function buildMemberLineTokens(line: ReviewLine, item: ApiItem) {
  for (const generator of generators) {
    if (generator.isValidFor(item)) {
      line.Tokens.push(...generator.generate(item));
      return; // Short-circuit on match
    }
  }
  // Fallback to legacy string parsing
}
```

### Benefits Demonstrated

1. **Correctness**: Enum re-exports now work correctly
2. **Clarity**: Function generator is ~60 lines vs complex string parsing
3. **Type Safety**: TypeScript enforces correct API usage
4. **Testability**: Can test generators independently with API model objects
5. **No Regressions**: Fallback ensures existing behavior preserved

## Migration Strategy

### Phase 0: Foundation (Complete in Prototype)

- [x] Create `TokenGenerator` interface
- [x] Create generator registry (`src/tokenGenerators/index.ts`)
- [x] Integrate into `buildMemberLineTokens` with fallback
- [x] Implement Function generator
- [x] Implement Enum generator

### Phase 1: Core Top-Level Items (P0)

**Goal**: Replace most common API patterns with semantic generators

1. **Class Generator** (`ApiItemKind.Class`)
   - Access modifiers: `public`, `private`, `protected`
   - Abstract classes
   - Type parameters with constraints
   - `extends` and `implements` clauses
   - Handle members separately (they have their own generators)
   
2. **Interface Generator** (`ApiItemKind.Interface`)
   - Type parameters with constraints
   - `extends` clauses
   - Handle members separately

3. **Method/MethodSignature Generators**
   - Static vs instance
   - Access modifiers
   - Optional/rest parameters
   - Overload handling (if needed)
   - Async functions

**Testing**:
- Create test fixtures for each generator
- Unit tests with API model objects
- Integration tests comparing output with legacy approach

**Success Criteria**:
- All P0 generators implemented
- Test coverage > 90%
- Zero regressions on existing API JSON files

### Phase 2: Type Members and Type Aliases (P1)

4. **Property/PropertySignature Generators**
   - Readonly modifier
   - Optional marker
   - Access modifiers (for Property)

5. **TypeAlias Generator**
   - Type parameters
   - Union/intersection types (may need helper)
   - Complex type expressions

6. **Variable Generator**
   - Improve beyond current simple implementation
   - Handle complex types

7. **Constructor Generator**
   - Parameter properties
   - Overloads

8. **EnumMember Generator**
   - String/number values
   - Computed values (rare)

**Testing**:
- Same approach as Phase 1

**Success Criteria**:
- All P1 generators implemented
- Legacy string parsing used only for complex/rare cases

### Phase 3: Advanced Features (P2)

9. **Namespace Generator**
   - Better than current template approach

10. **CallSignature/ConstructSignature Generators**
    - Function type expressions

11. **IndexSignature Generator**
    - Key types
    - Value types

**Testing**:
- Focus on edge cases

**Success Criteria**:
- Zero usage of `splitAndBuild()` for items with generators
- All 20 ApiItemKind types handled

### Phase 4: Shared Helpers and Refactoring

**Create Shared Utilities**:

1. **Type Expression Builder** (`src/tokenGenerators/typeExpression.ts`)
   - Recursively build tokens for complex types
   - Handle references with `NavigateToId`
   - Union/intersection formatting

2. **Type Parameters Builder** (`src/tokenGenerators/typeParameters.ts`)
   - Format `<T extends Foo, U = Bar>`
   - Constraints
   - Defaults

3. **Parameters Builder** (`src/tokenGenerators/parameters.ts`)
   - Format `(foo: string, bar?: number, ...rest: any[])`
   - Optional markers
   - Rest syntax

4. **Modifiers Builder** (`src/tokenGenerators/modifiers.ts`)
   - Access modifiers: `public`, `private`, `protected`
   - Other modifiers: `static`, `readonly`, `abstract`, `async`

**Refactor Existing Generators**:
- Use shared utilities for consistency
- Reduce duplication

**Success Criteria**:
- DRY code
- Consistent formatting across all generators

### Phase 5: Legacy Cleanup

1. **Deprecate String Parsing** (if possible):
   - Mark `splitAndBuild()` as deprecated
   - Add comments explaining when to use

2. **Remove Fallback** (optional, careful):
   - Once confident all cases covered
   - May want to keep fallback for unknown future cases

3. **Performance Testing**:
   - Benchmark new vs old approach
   - Optimize if needed (unlikely to be slower)

## Testing Strategy

### Unit Tests

**Per Generator** (`test/tokenGenerators/*.spec.ts`):
```typescript
describe("FunctionTokenGenerator", () => {
  it("generates tokens for simple function", () => {
    const model = new ApiModel();
    model.loadPackage("path/to/fixture.api.json");
    const func = model.findApiItemByLineId("@pkg!myFunc:function");
    
    const tokens = functionTokenGenerator.generate(func);
    
    expect(tokens).toEqual([
      { Kind: TokenKind.Keyword, Value: "export", ... },
      // ...
    ]);
  });
  
  it("handles type parameters", () => { /* ... */ });
  it("handles optional parameters", () => { /* ... */ });
  it("handles rest parameters", () => { /* ... */ });
});
```

### Integration Tests

**Compare Output** (`test/integration.spec.ts`):
```typescript
describe("Migration - No Regressions", () => {
  it("generates same output for azure-core", () => {
    const model = new ApiModel();
    model.loadPackage("fixtures/azure-core.api.json");
    
    const resultOld = generateWithLegacyParser(model);
    const resultNew = generateWithSemanticGenerators(model);
    
    expect(resultNew).toEqual(resultOld);
  });
});
```

### Test Fixtures

**Create Representative API JSON Files**:
- Simple cases (one function, one class)
- Complex cases (generics, inheritance, overloads)
- Real-world packages (azure-core, azure-storage-blob)

**Location**: `test/data/`

### Regression Prevention

**Continuous Integration**:
- Run full test suite on every PR
- Include large real-world API JSON files
- Compare output byte-for-byte with baseline

**Golden Files**:
- Store expected output for fixtures
- Update only when intentional changes made

## Implementation Guidelines

### Generator Template

```typescript
// src/tokenGenerators/myItem.ts
import { ApiItem, ApiItemKind, ApiMyItem } from "@microsoft/api-extractor-model";
import { ReviewToken, TokenKind } from "../models";
import { buildToken } from "../jstokens";
import { TokenGenerator } from "./interfaces";

function isValidFor(item: ApiItem): item is ApiMyItem {
  return item.kind === ApiItemKind.MyItem;
}

function generate(item: ApiMyItem): ReviewToken[] {
  const tokens: ReviewToken[] = [];
  
  // Build tokens semantically
  tokens.push({ Kind: TokenKind.Keyword, Value: "export", HasSuffixSpace: true });
  // ...
  
  return tokens;
}

export const myItemTokenGenerator: TokenGenerator = {
  isValidFor,
  generate,
};
```

### Registration

```typescript
// src/tokenGenerators/index.ts
import { myItemTokenGenerator } from "./myItem";

export const generators: TokenGenerator[] = [
  functionTokenGenerator,
  enumTokenGenerator,
  myItemTokenGenerator, // Add new generator
  // Order matters: more specific first
];
```

### Best Practices

1. **Type Guards**: Always use `item is ApiXxx` for type safety
2. **Error Handling**: Throw descriptive errors for invalid items
3. **Consistency**: Use `buildToken()` helper for default `HasSuffixSpace: false`
4. **Documentation**: Add JSDoc comments explaining special cases
5. **Testing**: Write tests before implementing
6. **Iterative**: Start simple, add complexity as needed

### Helper Functions Pattern

```typescript
// src/tokenGenerators/helpers.ts

export function buildTypeParameters(
  typeParams: readonly TypeParameter[]
): ReviewToken[] {
  const tokens: ReviewToken[] = [];
  if (typeParams.length === 0) return tokens;
  
  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: "<" }));
  // ... implementation
  tokens.push(buildToken({ Kind: TokenKind.Punctuation, Value: ">" }));
  
  return tokens;
}

export function buildParameters(
  params: readonly Parameter[]
): ReviewToken[] {
  // ... implementation
}
```

## Risk Mitigation

### Risks

1. **Breaking Changes**: New generators produce different output
2. **Coverage Gaps**: Some API patterns not covered by generators
3. **Performance**: New approach slower (unlikely)
4. **Maintenance**: More code to maintain

### Mitigations

1. **Fallback Mechanism**: Keep legacy string parsing as fallback
2. **Phased Rollout**: Implement one generator at a time
3. **Extensive Testing**: Integration tests with real API JSON files
4. **Feature Flag** (optional): Environment variable to enable/disable semantic generators
5. **Monitoring**: Track parser errors in production

### Rollback Plan

If major issues discovered:
1. Remove new generators from registry (`src/tokenGenerators/index.ts`)
2. Revert to empty array: `export const generators: TokenGenerator[] = []`
3. Legacy string parsing takes over immediately
4. No code removal needed

## Success Metrics

### Goals

1. **Zero Regressions**: Output identical for existing API JSON files (or intentionally improved)
2. **Bug Fixes**: Enum re-export bug fixed, other edge cases handled
3. **Code Quality**: Less string manipulation, more type-safe code
4. **Maintainability**: Easier to add new features (e.g., decorators, advanced generics)
5. **Performance**: No significant slowdown (<5% acceptable)

### Metrics to Track

- Code coverage: Target >90%
- Lines of code in `jstokens.ts`: Should decrease or stay same
- Number of regex replacements: Should decrease
- Test execution time: Should be similar
- Parser execution time on real packages: Should be similar

## Timeline Estimate

| Phase | Estimated Effort | Dependencies |
|-------|------------------|--------------|
| Phase 0: Foundation | Complete | - |
| Phase 1: P0 Items | 2-3 weeks | Phase 0 |
| Phase 2: P1 Items | 2-3 weeks | Phase 1 |
| Phase 3: P2 Items | 1-2 weeks | Phase 2 |
| Phase 4: Helpers & Refactor | 1 week | Phase 3 |
| Phase 5: Cleanup | 1 week | Phase 4 |
| **Total** | **7-10 weeks** | |

Note: Assumes 1 engineer working part-time (50%), includes testing and code review.

## Open Questions

1. **Overloads**: How does API Extractor represent overloaded functions/methods?
   - May need to handle multiple declarations
   - Need to investigate API model structure

2. **Decorators**: Are decorators in excerpt tokens or separate?
   - Likely in excerpt tokens (not common in azure-sdk-for-js)
   - Low priority

3. **JSDoc Integration**: Should generators also handle TSDoc comments?
   - Currently handled separately in `buildDocumentation()`
   - Probably keep separate

4. **Cross-Language IDs**: How to integrate with existing cross-language metadata?
   - Already supported in prototype branch
   - Ensure generators preserve LineId format

5. **Complex Type Expressions**: When do we fall back to excerpt tokens?
   - Union/intersection types with many members
   - Conditional types
   - Mapped types
   - Decision: Start with simple types, expand incrementally

## Conclusion

This migration plan provides a structured approach to moving from brittle string parsing to semantic, structure-aware token generation. The phased approach minimizes risk while delivering incremental value. The fallback mechanism ensures zero downtime and easy rollback if needed.

The prototype has already demonstrated the viability and benefits of this approach. Following this plan will result in a more maintainable, testable, and correct API parser for APIView.
