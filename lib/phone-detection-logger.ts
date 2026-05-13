/**
 * Phone detection logging for audit trail and security analytics.
 *
 * Logs external device detection events to Supabase for:
 *   - Security audit trail
 *   - Compliance reporting
 *   - Anomaly detection patterns
 */

import { supabase } from '@/lib/supabase';

export type PhoneDetectionEventType = 'DETECTED' | 'CLEARED';

export interface PhoneDetectionEvent {
  user_id: string;
  screen: 'vault' | 'viewer';
  event_type: PhoneDetectionEventType;
  confidence: number;
  device_info?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Log a phone detection event to Supabase.
 * Called when device is first detected or when detection clears.
 */
export async function logPhoneDetectionEvent(
  event: PhoneDetectionEvent
): Promise<void> {
  try {
    const { error } = await supabase.from('vault_phone_detection_logs').insert({
      user_id: event.user_id,
      screen: event.screen,
      event_type: event.event_type,
      confidence: event.confidence,
      timestamp: new Date().toISOString(),
      device_info: event.device_info ?? null,
      metadata: event.metadata ?? null,
    });

    if (error) {
      console.error('[PhoneDetectionLogger] Failed to insert log:', error);
    }
  } catch (err) {
    console.error('[PhoneDetectionLogger] Error logging event:', err);
    // Don't throw — logging failure shouldn't break the app
  }
}

/**
 * Query phone detection events for a user (useful for audit/analytics).
 */
export async function getUserPhoneDetectionLogs(
  userId: string,
  limit: number = 100
): Promise<PhoneDetectionEvent[]> {
  try {
    const { data, error } = await supabase
      .from('vault_phone_detection_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[PhoneDetectionLogger] Failed to fetch logs:', error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      user_id: row.user_id,
      screen: row.screen,
      event_type: row.event_type,
      confidence: row.confidence,
      device_info: row.device_info,
      metadata: row.metadata,
    }));
  } catch (err) {
    console.error('[PhoneDetectionLogger] Error fetching logs:', err);
    return [];
  }
}

/**
 * Get statistics about phone detection attempts for a user.
 */
export async function getPhoneDetectionStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('vault_phone_detection_logs')
      .select('event_type')
      .eq('user_id', userId);

    if (error) {
      console.error('[PhoneDetectionLogger] Failed to fetch stats:', error);
      return null;
    }

    return (data ?? []).reduce(
      (stats, row: { event_type: PhoneDetectionEventType }) => {
        stats[row.event_type] += 1;
        return stats;
      },
      { DETECTED: 0, CLEARED: 0 }
    );
  } catch (err) {
    console.error('[PhoneDetectionLogger] Error fetching stats:', err);
    return null;
  }
}
