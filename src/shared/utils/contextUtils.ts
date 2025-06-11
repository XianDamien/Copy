import type { Note, NoteType } from '../types';
import type { NoteContext, ContextCollectionConfig } from '../types/aiTypes';
import { DEFAULT_CONTEXT_CONFIG } from '../types/aiTypes';

/**
 * Extracts all field contents from a note into a flattened format
 */
export function extractNoteFields(note: Note): Record<string, string> {
  const fields: Record<string, string> = {};
  
  if (!note.fields) return fields;
  
  switch (note.noteType) {
    case 'CtoE':
      if (note.fields.CtoE) {
        fields.chinese = note.fields.CtoE.chinese || '';
        fields.english = note.fields.CtoE.english || '';
        fields.pinyin = note.fields.CtoE.pinyin || '';
        fields.notes = note.fields.CtoE.notes || '';
      }
      break;
      
    case 'Retranslate':
      if (note.fields.Retranslate) {
        fields.originalText = note.fields.Retranslate.originalText || '';
        fields.targetLanguage = note.fields.Retranslate.targetLanguage || '';
        fields.userTranslation = note.fields.Retranslate.userTranslation || '';
        fields.referenceTranslation = note.fields.Retranslate.referenceTranslation || '';
        fields.notes = note.fields.Retranslate.notes || '';
      }
      break;
      
    case 'SentenceParaphrase':
      if (note.fields.SentenceParaphrase) {
        fields.title = note.fields.SentenceParaphrase.title || '';
        fields.userLevel = note.fields.SentenceParaphrase.userLevel || '';
        // Convert segments to readable format
        if (note.fields.SentenceParaphrase.segments) {
          fields.segments = note.fields.SentenceParaphrase.segments
            .map(seg => seg.segmentText)
            .join(' ');
        }
      }
      break;
      
    case 'Article':
      if (note.fields.Article) {
        fields.title = note.fields.Article.title || '';
        fields.content = note.fields.Article.content || '';
        fields.difficulty = note.fields.Article.difficulty || '';
        // Convert questions to readable format
        if (note.fields.Article.questions) {
          fields.questions = note.fields.Article.questions
            .map(q => `Q: ${q.question} A: ${q.options[q.correctAnswer]}`)
            .join('\n');
        }
      }
      break;
      
    default:
      // Handle unknown note types gracefully
      break;
  }
  
  return fields;
}

/**
 * Extracts field contents from form data (for unsaved notes)
 */
export function extractFormFields(
  noteType: NoteType, 
  formData: Record<string, any>
): Record<string, string> {
  const fields: Record<string, string> = {};
  
  switch (noteType) {
    case 'CtoE':
      fields.chinese = formData.chinese || '';
      fields.english = formData.english || '';
      fields.pinyin = formData.pinyin || '';
      fields.notes = formData.notes || '';
      break;
      
    case 'Retranslate':
      fields.originalText = formData.originalText || '';
      fields.targetLanguage = formData.targetLanguage || '';
      fields.userTranslation = formData.userTranslation || '';
      fields.referenceTranslation = formData.referenceTranslation || '';
      fields.notes = formData.notes || '';
      break;
      
    // Add other note types as needed
    default:
      // Copy all string fields as-is for unknown types
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'string') {
          fields[key] = formData[key];
        }
      });
      break;
  }
  
  return fields;
}

/**
 * Filters and optimizes field content for AI consumption
 */
export function optimizeFieldsForAI(
  fields: Record<string, string>, 
  config: ContextCollectionConfig = DEFAULT_CONTEXT_CONFIG
): Record<string, string> {
  const optimized: Record<string, string> = {};
  
  // Filter empty fields if configured
  const filteredFields = config.includeEmpty 
    ? fields 
    : Object.fromEntries(
        Object.entries(fields).filter(([_, value]) => value.trim().length > 0)
      );
  
  // Prioritize important fields
  const prioritized = [...config.priorityFields, ...Object.keys(filteredFields)]
    .filter((field, index, arr) => arr.indexOf(field) === index); // Remove duplicates
  
  let totalLength = 0;
  
  for (const fieldName of prioritized) {
    if (fieldName in filteredFields) {
      let fieldValue = filteredFields[fieldName];
      
      // Truncate long fields
      if (fieldValue.length > config.maxFieldLength) {
        fieldValue = fieldValue.substring(0, config.maxFieldLength - 3) + '...';
      }
      
      // Check if adding this field would exceed reasonable total length
      if (totalLength + fieldValue.length > 3000) { // Reasonable AI context limit
        break;
      }
      
      optimized[fieldName] = fieldValue;
      totalLength += fieldValue.length;
    }
  }
  
  return optimized;
}

/**
 * Creates a complete NoteContext for AI requests
 */
export function createNoteContext(
  noteType: NoteType,
  allFields: Record<string, string>,
  currentField: string,
  selectedText: string,
  noteId?: number,
  deckId?: number,
  config?: ContextCollectionConfig
): NoteContext {
  const optimizedFields = optimizeFieldsForAI(allFields, config);
  
  return {
    noteType,
    allFields: optimizedFields,
    currentField,
    selectedText: selectedText.trim(),
    noteId,
    deckId
  };
}

/**
 * Generates a human-readable context summary for debugging
 */
export function getContextSummary(context: NoteContext): string {
  const fieldCount = Object.keys(context.allFields).length;
  const totalLength = Object.values(context.allFields).join('').length;
  
  return `Note Type: ${context.noteType} | Fields: ${fieldCount} | Content Length: ${totalLength} chars | Current: ${context.currentField} | Selected: "${context.selectedText}"`;
}

/**
 * Validates that a context has sufficient information for AI processing
 */
export function validateContext(context: NoteContext): { isValid: boolean; reason?: string } {
  if (!context.selectedText.trim()) {
    return { isValid: false, reason: 'No text selected' };
  }
  
  if (context.selectedText.length < 1) {
    return { isValid: false, reason: 'Selected text too short' };
  }
  
  if (context.selectedText.length > 500) {
    return { isValid: false, reason: 'Selected text too long (max 500 chars)' };
  }
  
  if (Object.keys(context.allFields).length === 0) {
    return { isValid: false, reason: 'No context fields available' };
  }
  
  return { isValid: true };
} 