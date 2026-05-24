import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";

import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/notesController.js";

import {
  getAllNotesSchema,
  noteIdSchema,
  createNoteSchema,
  updateNoteSchema,
} from "../validations/notesValidation.js";

const router = Router();

router.use(authenticate);
router.get("/notes", getAllNotesSchema, getAllNotes);
router.get("/notes/:noteId", noteIdSchema, getNoteById);
router.post("/notes", createNoteSchema, createNote);
router.patch("/notes/:noteId", updateNoteSchema, updateNote);
router.delete("/notes/:noteId", noteIdSchema, deleteNote);

export default router;
