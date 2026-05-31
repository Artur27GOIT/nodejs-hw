import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { User } from "../models/user.js";
import { Session } from "../models/session.js";

import { createSession, setSessionCookies } from "../services/auth.js";
import { sendEmail } from "../utils/sendMail.js";

const { JWT_SECRET, FRONTEND_DOMAIN } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, "..", "templates", "reset-password-email.html");

let resetTemplate;
const getResetTemplate = async () => {
  if (!resetTemplate) {
    const source = await fs.readFile(templatePath, "utf-8");
    resetTemplate = handlebars.compile(source);
  }
  return resetTemplate;
};

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

  if (session.refreshTokenValidUntil < new Date()) {
    await Session.deleteOne({ _id: session._id });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("sessionId");

    throw createHttpError(401, "Session token expired");
  }

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

export const requestResetEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({ message: "Password reset email sent successfully" });
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const resetLink = `${FRONTEND_DOMAIN}/reset-password?token=${token}`;

  const template = await getResetTemplate();
  const html = template({
    email: user.email,
    resetLink,
  });

  try {
    await sendEmail({
      to: user.email,
      subject: "Password reset",
      html,
    });
  } catch {
    throw createHttpError(500, "Failed to send the email, please try again later.");
  }

  res.status(200).json({ message: "Password reset email sent successfully" });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw createHttpError(401, "Invalid or expired token");
  }

  const user = await User.findOne({
    _id: payload.sub,
    email: payload.email,
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const hash = await bcrypt.hash(password, 10);
  user.password = hash;
  await user.save();

  res.status(200).json({ message: "Password reset successfully" });
};
