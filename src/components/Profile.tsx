
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { LogOut, Moon, Sun, User, Target, Calendar, TrendingUp, Crown, Star, Zap } from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { getYearlyProgress, dailyLogs, yearlyGoals } = useSupabaseStore();
  
  const yearlyProgress = getYearlyProgress();
  const totalDaysLogged = dailyLogs.filter(log => log.hours > 0).length;
  const completedGoals = yearlyGoals.filter(goal => 
    goal.logged_hours >= goal.estimated_hours
  ).length;

  const isDarkMode = theme === 'dark';

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const stats = [
    {
      icon: TrendingUp,
      label: "Total Hours Logged",
      value: yearlyProgress.completed.toFixed(1),
      unit: "hours"
    },
    {
      icon: Calendar,
      label: "Days Logged",
      value: totalDaysLogged,
      unit: "days"
    },
    {
      icon: Target,
      label: "Goals Completed",
      value: completedGoals,
      unit: `of ${yearlyGoals.length}`
    }
  ];

  return (
    <div className="space-y-6 p-4 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* User Info */}
      <Card className="p-6 glow-card hover-lift">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <User size={32} className="text-primary-foreground" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">
              {user?.user_metadata?.full_name || 'Anonymous User'}
            </h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="text-sm text-muted-foreground mt-1">
              Member since {new Date(user?.created_at || '').toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Upgrade to Pro Section */}
      <Card className="p-6 relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-yellow-400/20 via-amber-500/20 to-orange-600/20 hover-lift">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-amber-500/10 to-orange-600/10 animate-pulse"></div>
        <div className="relative z-10 text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Crown size={28} className="text-yellow-500" />
            <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 bg-clip-text text-transparent">
              Upgrade to Pro
            </h3>
            <Crown size={28} className="text-yellow-500" />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Unlock premium features and supercharge your productivity
          </p>
          
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20">
              <Star size={20} className="text-yellow-500 mx-auto mb-1" />
              <div className="text-xs font-medium text-foreground">Unlimited Goals</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20">
              <Zap size={20} className="text-amber-500 mx-auto mb-1" />
              <div className="text-xs font-medium text-foreground">Advanced Analytics</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-orange-600/20 to-yellow-400/20">
              <Target size={20} className="text-orange-500 mx-auto mb-1" />
              <div className="text-xs font-medium text-foreground">Priority Support</div>
            </div>
          </div>
          
          <Button className="w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 hover:from-yellow-500 hover:via-amber-600 hover:to-orange-700 text-black font-bold text-lg py-6 shadow-lg transform hover:scale-105 transition-all duration-200">
            <Crown size={20} className="mr-2" />
            Upgrade Now - $9.99/month
          </Button>
          
          <div className="text-xs text-muted-foreground">
            ✨ 30-day money-back guarantee
          </div>
        </div>
      </Card>

      {/* Analytics */}
      <Card className="p-6 glow-card hover-lift">
        <h3 className="text-lg font-semibold text-foreground mb-4">Personal Analytics</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center space-x-4 p-4 glassmorphism rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <stat.icon size={20} className="text-primary" />
              </div>
              
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="text-xl font-bold text-foreground">
                  {stat.value} <span className="text-sm font-normal text-muted-foreground">{stat.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Year Progress Summary */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold gradient-text">
              {yearlyProgress.percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              of yearly goal completed
            </div>
            <div className="text-xs text-muted-foreground">
              {yearlyProgress.isAhead ? '🎯 Ahead of schedule!' : '📈 Keep pushing forward!'}
            </div>
          </div>
        </div>
      </Card>

      {/* Settings */}
      <Card className="p-6 glow-card hover-lift">
        <h3 className="text-lg font-semibold text-foreground mb-4">Settings</h3>
        
        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 glassmorphism rounded-2xl">
            <div className="flex items-center space-x-3">
              {isDarkMode ? (
                <Moon size={20} className="text-foreground" />
              ) : (
                <Sun size={20} className="text-foreground" />
              )}
              <div>
                <Label htmlFor="theme-toggle" className="text-foreground">
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </Label>
                <div className="text-sm text-muted-foreground">
                  Toggle between light and dark themes
                </div>
              </div>
            </div>
            
            <Switch
              id="theme-toggle"
              checked={isDarkMode}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </div>
      </Card>

      {/* Sign Out */}
      <Card className="p-6 glow-card hover-lift border-destructive/20">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Account Actions</h3>
          
          <Button
            onClick={signOut}
            variant="destructive"
            size="lg"
            className="w-full flex items-center gap-2 glossy-gradient"
          >
            <LogOut size={20} />
            Sign Out
          </Button>
          
          <p className="text-xs text-muted-foreground">
            You'll be redirected to the login page
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
