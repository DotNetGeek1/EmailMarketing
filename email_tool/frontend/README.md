# Email Campaign Tool - Frontend

A modern React application for managing multilingual email campaigns with HTML templates, dynamic placeholders, and Playwright testing.

## Features

- **Dashboard**: Overview with quick actions and statistics
- **Campaigns**: Create and manage email campaigns
- **Templates**: Upload and manage HTML templates with placeholder extraction
- **Copy Management**: Manage localized copy for different languages
- **Testing**: Run Playwright tests to validate email templates

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Scripts** for build tooling
- **Modern ES6+** features

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Development

- **Hot Reload**: Changes will automatically reload in the browser
- **TypeScript**: Full type safety and IntelliSense support
- **ESLint**: Code linting with React-specific rules
- **Proxy**: API requests are proxied to `http://localhost:8000` (backend)

### Build

To create a production build:

```bash
npm run build
```

This creates an optimized build in the `build` folder.

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Application header
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── Modal.tsx       # Reusable modal component
│   ├── FormField.tsx   # Form input components
│   ├── LoadingSpinner.tsx
│   ├── CampaignList.tsx
│   ├── TemplateList.tsx
│   └── PlaceholderBadge.tsx
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Campaigns.tsx   # Campaign management
│   ├── Templates.tsx   # Template management
│   ├── CopyManagement.tsx
│   └── Testing.tsx     # Test results
├── App.tsx             # Main app component
└── index.tsx           # Application entry point
```

## API Integration

The frontend communicates with the FastAPI backend through the following endpoints:

- `POST /campaign` - Create campaigns
- `POST /template` - Upload templates
- `POST /copy/{campaign_id}/{language}` - Submit copy
- `POST /generate/{campaign_id}` - Generate emails
- `POST /test/{campaign_id}` - Run tests

## Component Architecture

The application follows a modular component architecture:

- **Page Components**: Handle high-level logic and layout
- **List Components**: Display data lists with actions
- **Form Components**: Handle user input and validation
- **UI Components**: Reusable UI elements (Modal, FormField, etc.)

This structure keeps files small and focused, making the codebase maintainable and scalable.

## Styling

All styling is done with Tailwind CSS classes, providing:
- Responsive design
- Consistent spacing and colors
- Dark mode support (ready for future implementation)
- Modern UI components

## Contributing

1. Follow the existing component structure
2. Use TypeScript for all new components
3. Keep page components focused on logic, delegate UI to components
4. Use Tailwind classes for styling
5. Ensure responsive design for mobile devices 