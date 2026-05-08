import { Router } from "express";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/notesController.js";

const router = Router();

router.get("/notes", getAllNotes);
router.get("/notes/:noteId", getNoteById);
router.post("/notes", createNote);
router.patch("/notes/:noteId", updateNote);
router.delete("/notes/:noteId", deleteNote);

export default router;
