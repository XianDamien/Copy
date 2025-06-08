# Chrome Extension Structure Analysis Task

**Task Identifier**: chrome_extension_structure_fix_20241228_001  
**Created**: 2024-12-28  
**Status**: Research Phase  

## Problem Statement

The AnGear Language Learning Extension cannot be loaded in Chrome due to missing essential Chrome extension files and structural components.

## Technical Analysis

### Current Architecture State

**Existing Components**:
- Core TypeScript business logic (Database, FSRS, API layer)
- React UI components (Popup, MainApp)
- Vite build configuration with @samrum/vite-plugin-web-extension
- Complete type system in `src/shared/types/index.ts`
- Test infrastructure with Vitest

**Missing Critical Components**:

#### 1. Chrome Extension Core Files
- **manifest.json**: Not generated due to build failures
- **public/ directory**: Completely absent
- **icons/ directory**: Referenced but non-existent

#### 2. Extension Pages Structure
- **src/options/**: Configuration points to missing directory
- **src/content/**: Content script files missing
- **Static HTML templates**: Some exist in src/ but not properly structured

#### 3. Build Pipeline Issues
- TypeScript compilation errors block manifest generation
- vite.config.ts references non-existent paths
- No ESLint configuration despite package.json script reference

### Code Flow Analysis

**Current Build Process**:
```
npm run build → tsc (fails) → vite build (never reached) → no dist/ output
```

**Expected Build Process**:
```
npm run build → tsc (clean) → vite build → dist/ with manifest.json + extension files
```

**Web Extension Plugin Configuration**:
The vite.config.ts contains complete manifest configuration but references missing files:
- `src/options/index.html` (missing)
- `src/content/index.tsx` (missing)  
- `icons/icon-*.png` (missing)
- `src/content/content.css` (missing)

### Dependency Analysis

**Working Dependencies**:
- `@samrum/vite-plugin-web-extension`: Properly configured
- React ecosystem: Complete and functional
- FSRS library integration: Implemented
- IndexedDB wrapper: Complete

**Missing Dependencies**:
- Chrome extension static assets
- ESLint configuration
- Content script implementation
- Options page implementation

### Architecture Implications

**Current State**: The project has comprehensive business logic but lacks the Chrome extension "wrapper" layer.

**Required Extension Points**:
1. **Background Service Worker**: Exists but cannot build
2. **Popup Interface**: Implemented but cannot package
3. **Content Scripts**: Configured but not implemented
4. **Options Page**: Referenced but not created
5. **Web Accessible Resources**: Configured but assets missing

## Key Technical Constraints

### Chrome Extension Requirements
- Manifest V3 compliance (configured correctly)
- Service Worker background script (exists)
- Content Security Policy considerations
- Permission declarations (properly configured)

### Build System Constraints
- TypeScript strict mode compilation
- Vite bundling for Chrome extension format
- Asset packaging and path resolution
- Development vs production builds

### Development Workflow Requirements
- Hot reload during development
- Extension loading in Chrome developer mode
- Test execution capability
- Build artifact generation

## Unknown Elements Requiring Investigation

1. **Icon Requirements**: What sizes and formats needed?
2. **Content Script Scope**: What functionality should be implemented?
3. **Options Page Design**: What settings should be configurable?
4. **Static Asset Dependencies**: What additional resources needed?
5. **CSP Compatibility**: Will current React/Vite setup work with extension CSP?

## Technical Debt Identification

**Immediate Technical Debt**:
- Unused React imports causing TypeScript errors
- Inconsistent API client instantiation patterns
- Missing error handling in build pipeline

**Architectural Technical Debt**:
- No separation between extension-specific and core business logic
- Hard-coded paths in configuration
- Missing abstraction layer for Chrome APIs

## Testing Strategy Considerations

**Current Test Coverage**:
- Unit tests for business logic (partial)
- Component tests (some working)
- Mock Chrome API setup (basic)

**Missing Test Coverage**:
- Extension loading tests
- Background script functionality
- Content script injection
- End-to-end extension workflow

## Next Research Questions

1. How should the content script integrate with existing React components?
2. What is the optimal directory structure for Chrome extension + React app hybrid?
3. Should static assets be in public/ or src/assets/?
4. How to handle development vs production Chrome extension loading?
5. What ESLint rules are needed for Chrome extension development?

---

**Research Status**: Complete  
**Ready for Planning Phase**: Yes  
**Critical Path Identified**: Build pipeline repair → Extension structure creation → Asset generation 