# Context
Filename: task-12-refactor-note-editor-page.md
Created On: 2025-01-27 23:20
Created By: Claude 4 Sonnet
Associated Protocol: RIPER-5 + Sequential Thinking + Agent Protocol

# Task Description
Refactor the main NoteEditor page component to integrate the new InteractiveEditor for RichContent note types while maintaining backward compatibility with existing note types (CtoE, Retranslate, etc.). This task completes Phase 1 of the Interactive Editor Foundation by connecting the annotation system to the main application workflow.

# Project Overview
This is the final task of Phase 1 for the Interactive Editor Foundation. The NoteEditor.tsx component currently handles various note types with traditional form inputs. We need to add support for RichContent notes that use the new InteractiveEditor with annotation capabilities, while preserving the existing functionality for other note types.

---
*The following sections are maintained by the AI during protocol execution*
---

# Analysis (Populated by RESEARCH mode)

## Current NoteEditor Analysis
- **Location**: `src/main/pages/NoteEditor.tsx`
- **Current Functionality**: Handles create/edit modes for various note types
- **Note Types Supported**: CtoE (Chinese to English) primarily
- **Props Interface**: Receives optional `noteId` for edit mode
- **State Management**: Form data, loading states, navigation

## Integration Requirements
- **RichContent Support**: Add branch for RichContent note type handling
- **InteractiveEditor Integration**: Import and configure InteractiveEditor component
- **Backward Compatibility**: Preserve existing functionality for CtoE notes
- **State Management**: Handle RichContentNoteFields data structure
- **API Integration**: Support create/update operations for RichContent notes

## Dependencies Analysis
- **InteractiveEditor**: Completed component with annotation system
- **AnnotationPopup**: Integrated popup for annotation management
- **Types**: RichContentNoteFields interface from shared/types
- **API Layer**: Existing note CRUD operations support RichContent type

# Proposed Solution (Populated by INNOVATE mode)

## Integration Strategy
**Conditional Rendering Approach**:
- Maintain existing form-based UI for CtoE notes
- Add InteractiveEditor branch for RichContent notes  
- Use noteType to determine which interface to render
- Preserve all existing navigation and save logic

**Data Handling**:
- Map RichContentNoteFields to/from Note.fields.RichContent
- Handle annotation data persistence through existing save operations
- Maintain form validation patterns for consistency

**User Experience**:
- Seamless transition between different note types
- Consistent save/cancel/navigation behavior
- Professional rich text editing for RichContent notes

## Implementation Approach
1. **Update NoteEditor Interface**: Add RichContent note type handling
2. **Conditional Component Rendering**: Switch between form and InteractiveEditor
3. **Data Layer Integration**: Map rich content data to note fields
4. **State Management Updates**: Handle InteractiveEditor state
5. **Save Logic Enhancement**: Support RichContent save operations

# Implementation Plan (Generated by PLAN mode)

## Subtask 12.1: Update NoteEditor Component Structure
**Files**: `src/main/pages/NoteEditor.tsx`
- [ ] Import InteractiveEditor and RichContentNoteFields types
- [ ] Add conditional rendering logic for note types
- [ ] Update component state to handle RichContent data
- [ ] Preserve existing CtoE note functionality
- [ ] Add proper TypeScript typing for new data structures

**Testing Command**: `npm run build && npm run test:note-editor-structure`

## Subtask 12.2: Implement RichContent Note Creation
**Files**: `src/main/pages/NoteEditor.tsx`  
- [ ] Add RichContent creation mode (when noteId is undefined)
- [ ] Initialize empty RichContentNoteFields structure
- [ ] Configure InteractiveEditor with proper props
- [ ] Handle form submission for new RichContent notes
- [ ] Connect with existing createNote API

**Testing Command**: `npm run build && npm run test:rich-content-creation`

## Subtask 12.3: Implement RichContent Note Editing
**Files**: `src/main/pages/NoteEditor.tsx`
- [ ] Add RichContent edit mode (when noteId is provided)
- [ ] Fetch existing note data and map to RichContent format
- [ ] Initialize InteractiveEditor with existing content and annotations
- [ ] Handle form submission for RichContent note updates
- [ ] Connect with existing updateNote API

**Testing Command**: `npm run build && npm run test:rich-content-editing`

## Subtask 12.4: Update Navigation and User Interface
**Files**: `src/main/pages/NoteEditor.tsx`
- [ ] Update page title/header for RichContent notes
- [ ] Ensure consistent navigation behavior (back to deck/card browser)
- [ ] Add proper loading states for RichContent operations
- [ ] Handle error states and user feedback
- [ ] Maintain industrial theme consistency

**Testing Command**: `npm run build && npm run test:rich-content-navigation`

## Subtask 12.5: Add Note Type Selection Interface
**Files**: `src/main/pages/NoteEditor.tsx`
- [ ] Create note type selection when creating new notes
- [ ] Add buttons/dropdown for CtoE vs RichContent selection
- [ ] Implement proper routing to selected note type interface
- [ ] Update MainApp.tsx navigation if needed
- [ ] Test complete workflow from deck to note creation

**Testing Command**: `npm run build && npm run test:note-type-selection`

---

**Priority**: P0 Critical (Required for Phase 1 completion)
**Estimated Time**: 3-4 hours
**Risk Level**: Medium (Integration complexity with existing code)
**Dependencies**: InteractiveEditor, AnnotationPopup, existing NoteEditor functionality 