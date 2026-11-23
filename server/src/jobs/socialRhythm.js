import { Activity, FollowUpTask, Notification, ResidentPreferences, CareCircle, User } from '../models/index.js';

export async function checkOverdue(now = new Date()) {
  const due = await Activity.find({ startsAt: { $lte: now }, status: { $in: ['Scheduled','Accepted','Missed','Overdue'] } });
  let created = 0;
  for (const activity of due) {
    const prefs = await ResidentPreferences.findOne({ resident: activity.resident });
    if (prefs?.consentToCircle === false) continue;
    const grace = (activity.graceMinutes ?? prefs?.graceMinutes ?? 30) * 60_000;
    if (now.getTime() < activity.startsAt.getTime() + grace) continue;
    const existing = await FollowUpTask.findOne({ activity: activity._id });
    if (existing) continue;
    activity.status = 'Follow-up Required'; await activity.save();
    const circle = await CareCircle.findOne({ resident: activity.resident, active: true });
    const coordinator = await User.findOne({ role: 'coordinator', active: true });
    const assignee = prefs?.followUpContacts?.[0] || coordinator?._id || activity.assignedTo;
    const task = await FollowUpTask.create({ activity: activity._id, resident: activity.resident, assignedTo: assignee, reason: 'An agreed activity remains unresolved after its grace period.' });
    if (assignee) await Notification.create({ user: assignee, title: 'A gentle check-in is due', message: 'An agreed activity needs a human follow-up. Please contact the resident using their preferences.', kind: 'follow-up', link: '/follow-ups' });
    if (activity.backup && activity.primary && String(activity.assignedTo || '') === String(activity.primary)) {
      activity.relayStatus = 'offered'; await activity.save();
      await Notification.create({ user: activity.backup, title: 'Care Relay request', message: 'A circle member could use backup for an agreed activity. Accept only if you are available.', kind: 'relay', link: '/schedule' });
    }
    if (!circle) { /* dashboard will surface the missing circle as an inclusion gap */ }
    created += 1;
  }
  return created;
}
export function startRhythmJob() {
  checkOverdue().catch(err => console.error('Social Rhythm Engine:', err.message));
  return setInterval(() => checkOverdue().catch(err => console.error('Social Rhythm Engine:', err.message)), 60_000);
}
