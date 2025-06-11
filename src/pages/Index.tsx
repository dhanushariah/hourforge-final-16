
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/components/Dashboard';
import ProductivityTimer from '@/components/ProductivityTimer';
import DailyLog from '@/components/DailyLog';
import TaskManager from '@/components/TaskManager';
import YearlyGoals from '@/components/YearlyGoals';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-bg bg-clip-text text-transparent mb-2">
            HourForge
          </h1>
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header with logout */}
        <div className="flex justify-between items-center p-4">
          <div></div>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
        
        {renderActiveComponent()}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
