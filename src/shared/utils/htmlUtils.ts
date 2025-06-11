/**
 * HTML Utilities for Rich Text Content Processing
 * Used for displaying rich text content in list/table views
 */

/**
 * Strips HTML tags from a string and returns plain text
 * @param html - HTML string to process
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove HTML tags using regex
  const plainText = html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace

  return plainText;
}

/**
 * Truncates text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Find the last space before the max length to avoid cutting words
  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    // If there's a space near the end, cut there
    return truncated.substring(0, lastSpaceIndex) + '...';
  } else {
    // Otherwise, just cut at max length
    return truncated + '...';
  }
}

/**
 * Strips HTML tags and truncates for display in lists/tables
 * @param html - HTML content to process
 * @param maxLength - Maximum length for display
 * @returns Clean, truncated plain text
 */
export function formatHtmlForDisplay(html: string, maxLength: number = 100): string {
  const plainText = stripHtmlTags(html);
  return truncateText(plainText, maxLength);
}

/**
 * Basic HTML sanitization for safe rendering
 * @param html - HTML to sanitize
 * @returns Sanitized HTML (basic implementation)
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Checks if a string contains HTML tags
 * @param text - Text to check
 * @returns True if contains HTML tags
 */
export function containsHtml(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  return /<[^>]*>/.test(text);
}

/**
 * Extracts plain text from HTML with better handling of common formatting
 * @param html - HTML content
 * @returns Plain text with some formatting preserved
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Handle common HTML elements with some formatting
  let processed = html
    .replace(/<br\s*\/?>/gi, '\n') // Convert breaks to newlines
    .replace(/<\/p>/gi, '\n\n') // Add spacing after paragraphs
    .replace(/<p[^>]*>/gi, '') // Remove paragraph tags
    .replace(/<\/div>/gi, '\n') // Add newlines after divs
    .replace(/<div[^>]*>/gi, '') // Remove div tags
    .replace(/<\/li>/gi, '\n') // Add newlines after list items
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive newlines
    .replace(/\n\s*\n/g, '\n') // Normalize double newlines
    .trim();

  return processed;
} 