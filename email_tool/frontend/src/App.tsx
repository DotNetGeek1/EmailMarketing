import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ToastProvider } from './contexts/ToastContext';
import { CustomerProvider, useCustomer } from './contexts/CustomerContext';
import LandingPage from './pages/LandingPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Testing from './pages/Testing';
import TagManagement from './pages/TagManagement';
import TestBuilder from './pages/TestBuilder';

type Page = 'dashboard' | 'projects' | 'project-detail' | 'testing' | 'tags' | 'test-builder';

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { selectedCustomer } = useCustomer();

  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      setCurrentPage(event.detail as Page);
    };
    window.addEventListener('navigate', handleNavigation as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigation as EventListener);
    };
  }, []);

  if (!selectedCustomer) {
    return <LandingPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <Projects />;
      case 'project-detail':
        return <ProjectDetail />;
      case 'testing':
        return <Testing />;
      case 'tags':
        return <TagManagement />;
      case 'test-builder':
        return <TestBuilder />;
      default:
        return <Dashboard />;
    }
  };

  return (
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
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
      <CustomerProvider>
        <ProjectProvider>
          <MainApp />
        </ProjectProvider>
      </CustomerProvider>
    </ToastProvider>
  </ThemeProvider>
);

export default App; 