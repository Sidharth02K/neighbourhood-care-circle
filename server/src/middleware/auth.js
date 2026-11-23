import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
export async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user || !user.active) return res.status(401).json({ message: 'This account is unavailable.' });
    req.user = user; next();
  } catch { return res.status(401).json({ message: 'Your session has expired. Please sign in again.' }); }
}
export const allow = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission to do that.' });
