/**
 * Settings Service - Chrome Storage Integration
 * Manages user configurable settings with chrome.storage.sync
 */

import { UserSettings, DEFAULT_USER_SETTINGS } from '../types/index';

const STORAGE_KEY = 'userSettings';

/**
 * Retrieves user settings from chrome.storage.sync
 * Merges stored settings with defaults to ensure all keys are present
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const storedSettings = result[STORAGE_KEY] as Partial<UserSettings> | undefined;
    
    // Merge stored settings with defaults to ensure all keys exist
    return {
      ...DEFAULT_USER_SETTINGS,
      ...storedSettings,
    };
  } catch (error) {
    console.error('Failed to load user settings:', error);
    return DEFAULT_USER_SETTINGS;
  }
}

/**
 * Saves user settings to chrome.storage.sync
 * Accepts partial settings to allow updating individual fields
 */
export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  try {
    // Get current settings first
    const currentSettings = await getSettings();
    
    // Merge with new settings
    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...settings,
    };
    
    // Save to storage
    await chrome.storage.sync.set({
      [STORAGE_KEY]: updatedSettings,
    });
    
    console.log('User settings saved successfully:', updatedSettings);
  } catch (error) {
    console.error('Failed to save user settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Clears all user settings and resets to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    await chrome.storage.sync.remove(STORAGE_KEY);
    console.log('User settings reset to defaults');
  } catch (error) {
    console.error('Failed to reset user settings:', error);
    throw new Error('Failed to reset settings');
  }
}

/**
 * Adds a listener for settings changes
 * Useful for components that need to react to settings updates
 */
export function addSettingsChangeListener(
  callback: (changes: UserSettings) => void
): void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes[STORAGE_KEY]) {
      const newSettings = changes[STORAGE_KEY].newValue as UserSettings;
      callback(newSettings);
    }
  };
  
  chrome.storage.onChanged.addListener(listener);
}

/**
 * Parses learning steps string into array of minutes
 * Example: "1 10" -> [1, 10]
 */
export function parseLearningSteps(stepsString: string): number[] {
  return stepsString
    .split(' ')
    .map(step => parseInt(step.trim(), 10))
    .filter(step => !isNaN(step) && step > 0);
}

/**
 * Validates user settings for correctness
 */
export function validateSettings(settings: Partial<UserSettings>): string[] {
  const errors: string[] = [];
  
  if (settings.learningSteps !== undefined) {
    const steps = parseLearningSteps(settings.learningSteps);
    if (steps.length === 0) {
      errors.push('Learning steps must contain at least one valid number');
    }
  }
  
  if (settings.relearningSteps !== undefined) {
    const steps = parseLearningSteps(settings.relearningSteps);
    if (steps.length === 0) {
      errors.push('Relearning steps must contain at least one valid number');
    }
  }
  
  if (settings.dailyNewCardsLimit !== undefined) {
    if (settings.dailyNewCardsLimit < 0 || settings.dailyNewCardsLimit > 1000) {
      errors.push('Daily new cards limit must be between 0 and 1000');
    }
  }
  
  if (settings.dailyReviewLimit !== undefined) {
    if (settings.dailyReviewLimit < 0 || settings.dailyReviewLimit > 10000) {
      errors.push('Daily review limit must be between 0 and 10000');
    }
  }
  
  return errors;
} 