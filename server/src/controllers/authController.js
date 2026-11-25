/** authController.js — Register / login / me / logout (spec §60, §91). */
import User from '../models/User.js';
import UserAchievement from '../models/UserAchievement.js';
import { signToken } from '../utils/token.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid email.' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'An account with that email already exists.' });

  const user = new User({ name: name.trim(), email: email.toLowerCase() });
  await user.setPassword(password);
  await user.save();

  const token = signToken({ sub: user._id.toString(), role: user.role });
  res.status(201).json({ token, user: user.toPublic() });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password.' });

  const token = signToken({ sub: user._id.toString(), role: user.role });
  res.json({ token, user: user.toPublic() });
});

export const me = asyncHandler(async (req, res) => {
  const achievementsCount = await UserAchievement.countDocuments({ userId: req.user._id });
  res.json({ user: { ...req.user.toPublic(), achievementsCount } });
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT: the client discards the token. Endpoint exists for symmetry.
  res.json({ message: 'Logged out' });
});
