# Semantic Token Generators - Implementation Checklist

## Phase 0: Foundation ✅
- [x] Create `TokenGenerator` interface
- [x] Create generator registry (`src/tokenGenerators/index.ts`)
- [x] Integrate into `buildMemberLineTokens` with fallback
- [x] Implement Function generator
- [x] Implement Enum generator

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
