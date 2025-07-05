import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { MarketingGroupProvider } from './contexts/MarketingGroupContext';
import { ToastProvider } from './contexts/ToastContext';
import { CustomerProvider, useCustomer } from './contexts/CustomerContext';
import { Page } from './types/navigation';
import LandingPage from './pages/LandingPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import MarketingGroups from './pages/MarketingGroups';
import Templates from './pages/Templates';
import CopyManagement from './pages/CopyManagement';
import Testing from './pages/Testing';
import TagManagement from './pages/TagManagement';
import TestBuilder from './pages/TestBuilder';
import MarketingGroupTypes from './pages/MarketingGroupTypes';

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    return (localStorage.getItem('currentPage') as Page) || 'dashboard';
  });
  const [pageParams, setPageParams] = useState<Record<string, any>>(() => {
    try {
      return JSON.parse(localStorage.getItem('pageParams') || '{}');
    } catch {
      return {};
    }
  });
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

  const handleNavigate = (page: Page, params?: Record<string, any>) => {
    setCurrentPage(page);
    setPageParams(params || {});
    localStorage.setItem('currentPage', page);
    localStorage.setItem('pageParams', JSON.stringify(params || {}));
  };

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
        return <ProjectDetail onNavigate={handleNavigate} />;
      case 'marketing-groups':
        return <MarketingGroups onNavigate={handleNavigate} />;
      case 'templates':
        return <Templates onNavigate={handleNavigate} params={pageParams} />;
      case 'copy':
        return <CopyManagement onNavigate={handleNavigate} params={pageParams} />;
      case 'testing':
        return <Testing />;
      case 'tags':
        return <TagManagement />;
      case 'test-builder':
        return <TestBuilder />;
      case 'marketing-group-types':
        return <MarketingGroupTypes />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-[#f4f4f4] transition-colors duration-200">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex min-h-screen">
        <Sidebar 
          isOpen={sidebarOpen} 
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-6">
          {renderPage()}
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
          <MarketingGroupProvider>
            <MainApp />
          </MarketingGroupProvider>
        </ProjectProvider>
      </CustomerProvider>
    </ToastProvider>
  </ThemeProvider>
);

export default App; 