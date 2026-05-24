import bcrypt from "bcrypt";
import createHttpError from "http-errors";

import { User } from "../models/user.js";
import { Session } from "../models/session.js";

import { createSession, setSessionCookies } from "../services/auth.js";

export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw createHttpError(400, "Email in use");
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({ email, password: hash });

  const session = await createSession(user._id);
  setSessionCookies(res, session);

  res.status(201).json(user);
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createHttpError(401, "Invalid credentials");
  }

  await Session.deleteMany({ userId: user._id });

  const session = await createSession(user._id);
  setSessionCookies(res, session);

  res.status(200).json(user);
};

export const refreshUserSession = async (req, res) => {
  const { sessionId, refreshToken } = req.cookies;

  const session = await Session.findOne({ _id: sessionId, refreshToken });

  if (!session) {
    throw createHttpError(401, "Session not found");
  }

  // 🔥 Якщо refresh-токен прострочений — видаляємо сесію + чистимо кукі
  if (session.refreshTokenValidUntil < new Date()) {
    await Session.deleteOne({ _id: session._id });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("sessionId");

    throw createHttpError(401, "Session token expired");
  }

  // 🔥 Якщо токен валідний — оновлюємо сесію
  await Session.deleteOne({ _id: session._id });

  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({ message: "Session refreshed" });
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.clearCookie("sessionId");

  res.status(204).end();
};
