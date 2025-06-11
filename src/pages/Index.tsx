
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/components/Dashboard';
import ProductivityTimer from '@/components/ProductivityTimer';
import DailyLog from '@/components/DailyLog';
import TaskManager from '@/components/TaskManager';
import YearlyGoals from '@/components/YearlyGoals';
import Profile from '@/components/Profile';
import BottomNavigation from '@/components/BottomNavigation';

const Index = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <img 
              src="/lovable-uploads/c7dec565-583e-4c78-a5c4-7fcad5b813cc.png" 
              alt="HourForge Logo" 
              className="w-12 h-12 object-contain animate-pulse"
            />
            <h1 className="text-3xl font-bold gradient-bg bg-clip-text text-transparent">
              HourForge
            </h1>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'timer':
        return <ProductivityTimer />;
      case 'log':
        return <DailyLog />;
      case 'tasks':
        return <TaskManager />;
      case 'goals':
        return <YearlyGoals />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <div className="max-w-md mx-auto">
        {renderActiveComponent()}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
