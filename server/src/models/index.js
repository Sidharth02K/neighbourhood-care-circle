import 'dotenv/config';

// Keep the local MongoDB setup working while allowing the production deployment
// to use Supabase Postgres through its server-only Data API key.
const adapter = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? await import('./supabase.js')
  : await import('./mongo.js');

export const databaseType = adapter.databaseType;
export const connectDatabase = adapter.connectDatabase;
export const disconnectDatabase = adapter.disconnectDatabase;
export const User = adapter.User;
export const ResidentPreferences = adapter.ResidentPreferences;
export const CareCircle = adapter.CareCircle;
export const Activity = adapter.Activity;
export const FollowUpTask = adapter.FollowUpTask;
export const CommunityEvent = adapter.CommunityEvent;
export const HelpRequest = adapter.HelpRequest;
export const WisdomExchange = adapter.WisdomExchange;
export const Participation = adapter.Participation;
export const Notification = adapter.Notification;
export const VolunteerVerification = adapter.VolunteerVerification;
