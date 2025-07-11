# Context
Filename: task-51-review-interface-enhancements.md
Created On: 2025-01-27
Created By: AI Assistant
Associated Protocol: RIPER-5

# Task Description
1. **Fix Bug**: The Review interface fails to display pre-existing "Reference Translation" and "Study Notes" when a card is first loaded. The data exists but is not shown.
2. **New Feature**: Implement a "Hint Popup". When the user hovers over a new "hint" icon, a floating preview of the card's English translation and study notes should appear, acting as a quick reference.

# Project Overview
LanGear is a language learning application. This task focuses on fixing a critical data-loading bug in the Review interface and enhancing the user experience by adding a non-intrusive hint system. The goal is to ensure data integrity from the backend to the frontend and provide a more fluid learning interaction.

---
*The following sections are maintained by the AI during protocol execution*
---

# Implementation Plan

This plan is divided into two main phases to ensure a structured and testable implementation.

## Phase 1: Fix Initial Data Loading Bug

The root cause is likely that the data structure for a card's note (`note.fields.CtoE`) is sometimes `null` or incomplete when fetched, and the frontend does not handle this gracefully. We will fix this by normalizing the data upon arrival.

### **1. Normalize Card Data on Load**
- **File**: `src/main/pages/Review.tsx`
- **Function**: `startReview`
- **Action**: After the `cardsWithNotes` array is populated, map over it to create a sanitized version that guarantees a consistent data structure for every card's note.
- **Rationale**: This is the core fix. It ensures that the rest of the component always receives a predictable `note` object, preventing errors and ensuring that even empty fields are handled correctly.
- **Testing**: After this change, run the application and check if the side panel now correctly displays pre-existing data when a card is first loaded.

## Phase 2: Implement "Hint Popup" Feature

We will create a new component for the popup and integrate it into the review screen with hover-to-show functionality.

### **2. Create the `HintPopup` Component**
- **New File**: `src/main/components/review/HintPopup.tsx`
- **Action**: Create a new, reusable React component.
- **Props**: It will accept `english: string` and `notes: string`.
- **Functionality**: The component will render a styled, floating div with two sections: "参考翻译" and "学习笔记".

### **3. Integrate `HintPopup` into the Review UI**
- **File**: `src/main/pages/Review.tsx`
- **Actions**: Add state management, trigger icon, hover logic, and conditional rendering.

## Phase 3: Final Testing and Validation

- **Test Case 1 (Bug Fix)**: Start a review session. For a card with existing notes, open the side panel. **Expected**: The panel correctly displays the notes and translation.
- **Test Case 2 (Feature)**: Hover over the lightbulb icon. **Expected**: The popup appears with the correct information.
- **Test Case 3 (Data Sync)**: Edit the notes in the side panel and save. Hover over the icon again. **Expected**: The popup shows the updated information.
- **Test Case 4 (Cleanup)**: Ensure any diagnostic console.log statements are removed. 