
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useTimerDatabase = () => {
  const { user } = useAuth();

  const createTimerSession = useCallback(async (startTime: string, date: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('timer_sessions')
      .insert({
        user_id: user.id,
        start_time: startTime,
        date: date,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [user]);

  const updateTimerSession = useCallback(async (sessionId: string, endTime: string, durationSeconds: number) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('timer_sessions')
      .update({
        end_time: endTime,
        duration_seconds: durationSeconds,
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) throw error;
  }, [user]);

  const updateDailyLog = useCallback(async (date: string, hours: number) => {
    if (!user) throw new Error('User not authenticated');

    const { data: existingLog, error: fetchError } = await supabase
      .from('daily_logs')
      .select('id, hours')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const roundedHours = Math.round(hours * 100) / 100;

    if (existingLog) {
      const newTotal = existingLog.hours + roundedHours;
      
      if (newTotal > 12) {
        throw new Error(`Adding ${roundedHours.toFixed(2)} hours would exceed the 12-hour daily limit. Current: ${existingLog.hours.toFixed(2)}h`);
      }

      const { error: updateError } = await supabase
        .from('daily_logs')
        .update({
          hours: newTotal,
          notes: `Automated Timer Session - ${roundedHours.toFixed(2)}h added`,
        })
        .eq('id', existingLog.id);

      if (updateError) throw updateError;
      return newTotal;
    } else {
      if (roundedHours > 12) {
        throw new Error(`Session duration ${roundedHours.toFixed(2)} hours exceeds the 12-hour daily limit.`);
      }

      const { error: insertError } = await supabase
        .from('daily_logs')
        .insert({
          user_id: user.id,
          date: date,
          hours: roundedHours,
          notes: `Automated Timer Session - ${roundedHours.toFixed(2)}h`,
        });

      if (insertError) throw insertError;
      return roundedHours;
    }
  }, [user]);

  return {
    createTimerSession,
    updateTimerSession,
    updateDailyLog,
  };
};
