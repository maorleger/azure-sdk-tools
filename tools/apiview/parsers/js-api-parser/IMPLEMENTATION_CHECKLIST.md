# Semantic Token Generators - Implementation Checklist

## Progress Summary

### Completed Phases

#### Phase 0: Foundation ✅
**Status**: Complete (from prototype)
- [x] Create `TokenGenerator` interface
- [x] Create generator registry (`src/tokenGenerators/index.ts`)
- [x] Integrate into `buildMemberLineTokens` with fallback
- [x] Implement Function generator
- [x] Implement Enum generator

**Cleanup Work**:
- Fixed enum generator to not output braces (parent logic handles it via `mayHaveChildren()`)
- Fixed test to use correct data file (`renamedEnum.json` instead of `re-exported.json`)
- Removed debug console.log statements
- Added placeholder test for function generator

#### Phase 1.1: Interface Generator ✅
**Status**: Complete - All 4 tests passing

**Key Learnings**:
1. **API Extractor Model Structure**: Interfaces use `extendsTypes` (array of `HeritageType` objects), not `extendsTokenRanges`
2. **Token Extraction**: Use `heritageType.excerpt.spannedTokens` NOT `excerpt.tokens` - the latter includes ALL tokens from the file, while spannedTokens only includes the relevant range
3. **Member Ordering**: API Extractor sorts members alphabetically, not by JSON order - use `.find(m => m.displayName === "Name")` instead of array indices
4. **Required Metadata**: Test data JSON files must include `tsdocConfig` with `$schema` property or loading fails

**Implementation Details**:
- Type parameters: Direct access via `item.typeParameters[].name`
- Extends clause: Iterate through `item.extendsTypes[].excerpt.spannedTokens`
- Navigation IDs: Extract from `token.canonicalReference.toString()` for Reference tokens
- Skip whitespace: Check `token.text.trim()` before adding tokens

**Challenges Overcome**:
- Initial confusion about `extendsTokenRanges` being undefined - discovered API Model exposes `extendsTypes` property instead
- First attempt parsed wrong tokens (full declaration) - fixed by using `spannedTokens` instead of `tokens`

#### Phase 1.2: Class Generator ✅  
**Status**: Complete - All 6 tests passing

**Key Learnings**:
1. **Extends vs Implements**: Classes have `extendsType` (singular, single base class) and `implementsTypes` (array, multiple interfaces)
2. **Empty Heritage Types**: Must check `item.extendsType.excerpt.spannedTokens.length > 0` - API Extractor creates empty heritage types when there's no actual inheritance
3. **Abstract Modifier**: Classes have `isAbstract` boolean property - add keyword before "class" if true

**Implementation Details**:
- Abstract classes: Check `item.isAbstract` and add keyword
- Extends: Similar to interface, but singular `extendsType` instead of array
- Implements: Array handling like interface extends, but with "implements" keyword
- Pattern reuse: Very similar structure to interface generator, demonstrating good abstraction

**Challenges Overcome**:
- Initial test failures showed extra "extends" keyword for classes without base classes
- Fixed by checking `spannedTokens.length > 0` before adding extends clause
- Test data required correct `extendsTokenRange` structure (with startIndex/endIndex)

### Current Status
- ✅ **Phase 0**: Complete
- ✅ **Phase 1.1**: Complete (Interface Generator)
- ✅ **Phase 1.2**: Complete (Class Generator)
- 🔄 **Phase 1.3**: Next (Method Generator)

**Test Statistics**:
- Total tests: 12 passing (0 failing)
- Test files: 4
- Generators implemented: 4 (Function, Enum, Interface, Class)
- Lines of generator code: ~300 (vs thousands in legacy string parsing)

**Key Success Factors**:
1. **TDD Approach**: Writing failing tests first caught edge cases early
2. **Test Data Quality**: Comprehensive JSON fixtures covering multiple scenarios
3. **Semantic API Understanding**: Learning the API Extractor Model structure upfront saved debugging time
4. **Pattern Reuse**: Interface generator pattern worked well for classes with minor modifications

## Phase 1: Core Top-Level Items (P0)

### 1.1 Interface Generator ✅
- [x] Write failing test for simple interface
- [x] Write failing test for interface with type parameters
- [x] Write failing test for interface with extends clause
- [x] Implement interface generator
- [x] Run tests and verify all pass
- [x] Commit: "feat: add interface token generator"

### 1.2 Class Generator ✅
- [x] Write failing test for simple class
- [x] Write failing test for class with type parameters
- [x] Write failing test for abstract class
- [x] Write failing test for class with extends clause
- [x] Write failing test for class with implements clause
- [x] Implement class generator
- [x] Run tests and verify all pass
- [x] Commit: "feat: add class token generator"

### 1.3 Method Generator
- [ ] Write failing test for simple method
- [ ] Write failing test for method with type parameters
- [ ] Write failing test for static method
- [ ] Write failing test for async method
- [ ] Write failing test for method with optional parameters
- [ ] Implement method generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add method token generator"

### 1.4 MethodSignature Generator
- [ ] Write failing test for simple method signature
- [ ] Write failing test for method signature with type parameters
- [ ] Write failing test for optional method signature
- [ ] Implement method signature generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add method signature token generator"

## Phase 2: Type Members and Type Aliases (P1)

### 2.1 Property Generator
- [ ] Write failing test for simple property
- [ ] Write failing test for readonly property
- [ ] Write failing test for optional property
- [ ] Write failing test for static property
- [ ] Implement property generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add property token generator"

### 2.2 PropertySignature Generator
- [ ] Write failing test for simple property signature
- [ ] Write failing test for readonly property signature
- [ ] Write failing test for optional property signature
- [ ] Implement property signature generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add property signature token generator"

### 2.3 TypeAlias Generator
- [ ] Write failing test for simple type alias
- [ ] Write failing test for type alias with type parameters
- [ ] Write failing test for union type alias
- [ ] Implement type alias generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add type alias token generator"

### 2.4 Variable Generator
- [ ] Write failing test for simple variable
- [ ] Write failing test for variable with complex type
- [ ] Implement variable generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add variable token generator"

### 2.5 Constructor Generator
- [ ] Write failing test for simple constructor
- [ ] Write failing test for constructor with parameters
- [ ] Implement constructor generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add constructor token generator"

### 2.6 EnumMember Generator
- [ ] Write failing test for enum member
- [ ] Write failing test for enum member with value
- [ ] Implement enum member generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add enum member token generator"

## Phase 3: Advanced Features (P2)

### 3.1 Namespace Generator
- [ ] Write failing test for namespace
- [ ] Implement namespace generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add namespace token generator"

### 3.2 CallSignature Generator
- [ ] Write failing test for call signature
- [ ] Implement call signature generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add call signature token generator"

### 3.3 ConstructSignature Generator
- [ ] Write failing test for construct signature
- [ ] Implement construct signature generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add construct signature token generator"

### 3.4 IndexSignature Generator
- [ ] Write failing test for index signature
- [ ] Implement index signature generator
- [ ] Run tests and verify all pass
- [ ] Commit: "feat: add index signature token generator"

## Phase 4: Shared Helpers and Refactoring

### 4.1 Create Helper Functions
- [ ] Extract type parameters builder
- [ ] Extract parameters builder
- [ ] Extract modifiers builder
- [ ] Extract type expression builder
- [ ] Write tests for helpers
- [ ] Commit: "refactor: extract shared token builder helpers"

### 4.2 Refactor Existing Generators
- [ ] Refactor function generator to use helpers
- [ ] Refactor enum generator to use helpers
- [ ] Refactor other generators to use helpers
- [ ] Run all tests and verify they pass
- [ ] Commit: "refactor: use shared helpers in all generators"

## Phase 5: Legacy Cleanup

### 5.1 Documentation and Deprecation
- [ ] Add deprecation comments to `splitAndBuild()`
- [ ] Update README with generator documentation
- [ ] Add migration guide
- [ ] Commit: "docs: document semantic generators and deprecate legacy parsing"

### 5.2 Performance Testing
- [ ] Create performance benchmark suite
- [ ] Compare old vs new approach
- [ ] Document results
- [ ] Commit: "test: add performance benchmarks"

### 5.3 Integration Testing
- [ ] Test with real azure-sdk packages
- [ ] Verify no regressions
- [ ] Document any intentional changes
- [ ] Commit: "test: add integration tests with real packages"

## Notes
- After each commit, push to branch
- Update this checklist as you complete items
- Mark items with ✅ when done
