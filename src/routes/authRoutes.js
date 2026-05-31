import { Router } from "express";
import { celebrate, Segments } from "celebrate";

import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  requestResetEmail,
  resetPassword,
} from "../controllers/authController.js";

import {
  registerUserSchema,
  loginUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
} from "../validations/authValidation.js";

const router = Router();

router.post("/auth/register", celebrate({ [Segments.BODY]: registerUserSchema }), registerUser);

router.post("/auth/login", celebrate({ [Segments.BODY]: loginUserSchema }), loginUser);

router.post("/auth/refresh", refreshUserSession);

router.post("/auth/logout", logoutUser);

router.post(
  "/auth/request-reset-email",
  celebrate({ [Segments.BODY]: requestResetEmailSchema }),
  requestResetEmail
);

router.post(
  "/auth/reset-password",
  celebrate({ [Segments.BODY]: resetPasswordSchema }),
  resetPassword
);

export default router;
