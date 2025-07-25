# Context
Filename: task-11-fix-review-page-content-loading.md
Created On: 2025-01-27 23:15
Created By: Claude 4 Sonnet
Associated Protocol: RIPER-5 + Sequential Thinking + Agent Protocol

# Task Description
**Critical Bug**: The FSRS review page shows blank content instead of card questions due to incorrect API usage in Review.tsx. Even when due cards are found, the component fails to load note content because it uses `getNotesByDeck(card.noteId)` instead of `getNoteById(card.noteId)`, causing the review session to display nothing.

**User Requirements**:
- Fix card content loading in review sessions
- Ensure review page displays card questions correctly
- Fix navigation logic for main "Review" button
- Prevent blank page scenarios during review

# Project Overview
AnGear Language Learning Extension - Chrome extension for spaced repetition learning. The Review.tsx component can find due cards but fails to load their content due to incorrect API method usage, resulting in blank review sessions that block the core learning functionality.

---
*The following sections are maintained by the AI during protocol execution*
---

# Analysis (Populated by RESEARCH mode)

## Critical Issues Identified

1. **Incorrect API Call in Review.tsx**: 
   - Line 78: Uses `await apiClient.getNotesByDeck(card.noteId)` which expects deckId but receives noteId
   - This call likely returns empty array or error, causing note lookup to fail
   - Results in empty `cardsWithNotes` array despite finding due cards

2. **Flawed Note Lookup Logic**:
   - Code tries to find note with `notes.find(n => n.id === card.noteId)` after wrong API call
   - Logic assumes multiple notes returned when only one specific note is needed
   - Should use `getNoteById(card.noteId)` like CardBrowser.tsx does correctly

3. **Missing State Validation**:
   - Component transitions to 'question' state even when no card content loaded
   - No check if `cardsWithNotes.length > 0` before showing question UI
   - Causes blank page when `getCurrentCard()` returns undefined

4. **Navigation Context Issue**:
   - Main "Review" button doesn't reset `selectedDeckId` context
   - Can lead to unexpected behavior when switching between deck-specific and general review

## Existing Working Examples
- **CardBrowser.tsx**: Correctly uses `apiClient.getNoteById(card.noteId)` for loading note content
- **API Pattern**: Single note lookup should use `getNoteById`, not `getNotesByDeck`

# Proposed Solution (Populated by PLAN mode)

## Two-Part Solution Approach

### Part 1: Fix Card Content Loading
- Replace incorrect `getNotesByDeck` call with correct `getNoteById`
- Simplify note handling logic to use direct result
- Add state validation before transitioning to question view

### Part 2: Fix Navigation Logic  
- Update `handleNavigation` to reset deck context for main Review button
- Ensure predictable navigation behavior

# Implementation Plan (Generated by PLAN mode)

## Implementation Checklist

### Phase 1: Fix MainApp.tsx Navigation Logic ✅
1. [x] Update `handleNavigation` function to check for `page === 'review'`
2. [x] Add `setSelectedDeckId(null)` call for review page navigation
3. [x] Ensure main Review button always shows deck selection

### Phase 2: Fix Review.tsx Card Content Loading ✅  
4. [x] Locate the `for...of` loop in `startReview` function
5. [x] Replace `await apiClient.getNotesByDeck(card.noteId)` with `await apiClient.getNoteById(card.noteId)`
6. [x] Remove unnecessary `notes.find(n => n.id === card.noteId)` line
7. [x] Add validation check `if (cardsWithNotes.length > 0)` after loop
8. [x] Move state updates inside validation block
9. [x] Add else block to handle empty cards scenario

### Phase 3: Testing and Verification ✅
10. [x] Build project to verify no TypeScript errors
11. [x] Test deck-specific review from DeckList
12. [x] Test deck-specific review from CardBrowser  
13. [x] Test main navigation Review button behavior
14. [x] Verify card content loads correctly in review sessions
15. [x] Create implementation summary document

**Test Commands**:
- Build test: `npm run build`
- Type check: `npx tsc --noEmit`

**Priority**: P0 Critical (Blocks core functionality)
**Estimated Time**: 30-45 minutes
**Risk Level**: Low (Well-defined API fix)
**Dependencies**: Existing API methods, Review component structure 