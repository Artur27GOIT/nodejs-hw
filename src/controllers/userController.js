import createHttpError from "http-errors";
import { User } from "../models/user.js";
import { saveFileToCloudinary } from "../utils/saveFileToCloudinary.js";

export const updateUserAvatar = async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, "No file");
  }

  const userId = req.user._id.toString();

  const result = await saveFileToCloudinary(req.file.buffer, userId);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { avatar: result.secure_url },
    { returnDocument: "after" }
  );

  return res.status(200).json({
    url: updatedUser.avatar,
  });
};
