
import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import ProductivityTimer from '@/components/ProductivityTimer';
import DailyLog from '@/components/DailyLog';
import TaskManager from '@/components/TaskManager';
import YearlyGoals from '@/components/YearlyGoals';
import BottomNavigation from '@/components/BottomNavigation';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

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
