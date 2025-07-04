import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import CopyManagement from './pages/CopyManagement';
import Testing from './pages/Testing';
import TagManagement from './pages/TagManagement';

type Page = 'dashboard' | 'campaigns' | 'templates' | 'copy' | 'testing' | 'tags';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'campaigns':
        return <Campaigns />;
      case 'templates':
        return <Templates />;
      case 'copy':
        return <CopyManagement />;
      case 'testing':
        return <Testing />;
      case 'tags':
        return <TagManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex">
          <Sidebar 
            isOpen={sidebarOpen} 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onClose={() => setSidebarOpen(false)}
          />
          
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App; 