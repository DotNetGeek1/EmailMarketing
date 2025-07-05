// API Configuration
// Use environment variable if provided, otherwise default to local backend
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to build API URLs
export const apiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
}; 