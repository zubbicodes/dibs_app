-- Vault Phone Detection Logs table
-- Tracks external device (phone/camera) detection events during vault access
-- Used for security audit trail and compliance reporting

CREATE TABLE IF NOT EXISTS vault_phone_detection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and context
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screen text NOT NULL CHECK (screen IN ('vault', 'viewer')),
  
  -- Detection details
  event_type text NOT NULL CHECK (event_type IN ('DETECTED', 'CLEARED')),
  confidence float8 NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Metadata and audit
  timestamp timestamptz NOT NULL DEFAULT now(),
  device_info jsonb,
  metadata jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_vault_phone_detection_user_id ON vault_phone_detection_logs(user_id);
CREATE INDEX idx_vault_phone_detection_timestamp ON vault_phone_detection_logs(timestamp DESC);
CREATE INDEX idx_vault_phone_detection_user_time ON vault_phone_detection_logs(user_id, timestamp DESC);
CREATE INDEX idx_vault_phone_detection_event_type ON vault_phone_detection_logs(event_type);

-- Enable RLS (Row Level Security)
ALTER TABLE vault_phone_detection_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own detection logs
CREATE POLICY "Users can view their own phone detection logs"
  ON vault_phone_detection_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own detection logs
CREATE POLICY "Users can insert their own phone detection logs"
  ON vault_phone_detection_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE vault_phone_detection_logs IS 'Audit log for external device detection during vault/viewer access. Used for security compliance and anomaly detection.';
COMMENT ON COLUMN vault_phone_detection_logs.confidence IS 'Confidence score (0-1) of the detection. Higher = more certain it was a phone/camera.';
COMMENT ON COLUMN vault_phone_detection_logs.device_info IS 'Device-specific metadata (OS, model, app version, session ID, etc.)';
COMMENT ON COLUMN vault_phone_detection_logs.metadata IS 'Additional context (e.g., detection model version, frame count, class detected)';
