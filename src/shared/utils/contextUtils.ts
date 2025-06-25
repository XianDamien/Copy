import type { Note, NoteType } from '../types';

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