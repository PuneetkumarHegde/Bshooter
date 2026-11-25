/** adminController.js — Admin level management (spec §92). Admin-only routes. */
import Level from '../models/Level.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listLevels = asyncHandler(async (req, res) => {
  const levels = await Level.find().sort({ levelNumber: 1 }).lean();
  res.json({ levels });
});

export const createLevel = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.levelNumber || !body.objective || !body.shots) {
    return res.status(400).json({ message: 'levelNumber, objective and shots are required.' });
  }
  const exists = await Level.findOne({ levelNumber: body.levelNumber });
  if (exists) return res.status(409).json({ message: 'A level with that number already exists.' });
  const level = await Level.create(body);
  res.status(201).json({ level });
});

export const updateLevel = asyncHandler(async (req, res) => {
  const level = await Level.findOneAndUpdate({ levelNumber: Number(req.params.id) }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!level) return res.status(404).json({ message: 'Level not found' });
  res.json({ level });
});

export const deleteLevel = asyncHandler(async (req, res) => {
  const level = await Level.findOneAndDelete({ levelNumber: Number(req.params.id) });
  if (!level) return res.status(404).json({ message: 'Level not found' });
  res.json({ message: 'Level deleted' });
});

export const setPublished = asyncHandler(async (req, res) => {
  const level = await Level.findOneAndUpdate(
    { levelNumber: Number(req.params.id) },
    { isPublished: !!req.body.isPublished },
    { new: true }
  );
  if (!level) return res.status(404).json({ message: 'Level not found' });
  res.json({ level });
});
