// API Configuration
export const API_BASE_URL = 'http://localhost:8000';

// Helper function to build API URLs
export const apiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
}; 