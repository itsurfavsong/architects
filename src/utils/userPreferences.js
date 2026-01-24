// utils/userPreferences.js
const PREFERENCES_KEY = 'alert_preferences';

const DEFAULT_PREFERENCES = {
  filterMonths: 1,
  sortOrder: 'desc',
  itemsPerPage: 10,
};

export const saveUserPreferences = (preferences) => {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch (e) {
    console.error('Failed to save preferences:', e);
    return false;
  }
};

export const getUserPreferences = () => {
  try {
    const prefs = localStorage.getItem(PREFERENCES_KEY);
    return prefs ? { ...DEFAULT_PREFERENCES, ...JSON.parse(prefs) } : DEFAULT_PREFERENCES;
  } catch (e) {
    console.error('Failed to load preferences:', e);
    return DEFAULT_PREFERENCES;
  }
};

export const updateUserPreference = (key, value) => {
  const currentPrefs = getUserPreferences();
  const newPrefs = { ...currentPrefs, [key]: value };
  return saveUserPreferences(newPrefs);
};