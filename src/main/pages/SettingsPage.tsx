/**
 * Settings Page Component
 * Provides user interface for configuring learning preferences
 */

import { useState, useEffect } from 'react';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../../shared/types/index';
import { getSettings, saveSettings, validateSettings } from '../../shared/utils/settingsService';

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userSettings = await getSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setErrors(['Failed to load settings. Using defaults.']);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle input changes
  const handleInputChange = (field: keyof UserSettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear success message when user makes changes
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle form submission
  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    setSuccessMessage('');

    try {
      // Validate settings
      const validationErrors = validateSettings(settings);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setSaving(false);
        return;
      }

      // Save settings
      await saveSettings(settings);
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrors(['Failed to save settings. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  // Handle reset to defaults
  const handleReset = () => {
    setSettings(DEFAULT_USER_SETTINGS);
    setErrors([]);
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Learning Settings</h1>
        
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Learning Steps */}
          <div>
            <label htmlFor="learningSteps" className="block text-sm font-medium text-gray-700 mb-2">
              Learning Steps (minutes)
            </label>
            <input
              id="learningSteps"
              type="text"
              value={settings.learningSteps}
              onChange={(e) => handleInputChange('learningSteps', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 1 10"
            />
            <p className="mt-1 text-sm text-gray-500">
              Space-separated intervals in minutes for learning new cards (e.g., "1 10" for 1 minute and 10 minutes)
            </p>
          </div>

          {/* Relearning Steps */}
          <div>
            <label htmlFor="relearningSteps" className="block text-sm font-medium text-gray-700 mb-2">
              Relearning Steps (minutes)
            </label>
            <input
              id="relearningSteps"
              type="text"
              value={settings.relearningSteps}
              onChange={(e) => handleInputChange('relearningSteps', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 10"
            />
            <p className="mt-1 text-sm text-gray-500">
              Space-separated intervals in minutes for relearning failed cards (e.g., "10" for 10 minutes)
            </p>
          </div>

          {/* Daily New Cards Limit */}
          <div>
            <label htmlFor="dailyNewCardsLimit" className="block text-sm font-medium text-gray-700 mb-2">
              Daily New Cards Limit
            </label>
            <input
              id="dailyNewCardsLimit"
              type="number"
              min="0"
              max="1000"
              value={settings.dailyNewCardsLimit}
              onChange={(e) => handleInputChange('dailyNewCardsLimit', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum number of new cards to introduce per day (0-1000)
            </p>
          </div>

          {/* Daily Review Limit */}
          <div>
            <label htmlFor="dailyReviewLimit" className="block text-sm font-medium text-gray-700 mb-2">
              Daily Review Limit
            </label>
            <input
              id="dailyReviewLimit"
              type="number"
              min="0"
              max="10000"
              value={settings.dailyReviewLimit}
              onChange={(e) => handleInputChange('dailyReviewLimit', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum number of review cards to show per day (0-10000)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">About These Settings</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Learning Steps:</strong> Define the intervals for new cards. When you rate a new card as "Good", it will be shown again at these intervals.</p>
          <p><strong>Relearning Steps:</strong> Define the intervals for cards you got wrong. Failed cards will be shown again at these intervals.</p>
          <p><strong>Daily Limits:</strong> Control how many cards you study each day. Set limits that match your available study time.</p>
          <p><strong>Sync:</strong> These settings are synchronized across all your Chrome browsers where you're logged in.</p>
        </div>
      </div>
    </div>
  );
} 