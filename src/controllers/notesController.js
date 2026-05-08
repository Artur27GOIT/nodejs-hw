import createHttpError from "http-errors";
import { Note } from "../models/note.js";

export const getAllNotes = async (req, res) => {
  const notes = await Note.find();
  res.status(200).json(notes);
};

export const getNoteById = async (req, res) => {
  const { noteId } = req.params;
  const note = await Note.findById(noteId);

  if (!note) {
    throw createHttpError(404, "Note not found");
  }

  res.status(200).json(note);
};

export const createNote = async (req, res) => {
  const newNote = await Note.create(req.body);
  res.status(201).json(newNote);
};

export const updateNote = async (req, res) => {
  const { noteId } = req.params;

  const updated = await Note.findByIdAndUpdate(noteId, req.body, {
    new: true,
  });

  if (!updated) {
    throw createHttpError(404, "Note not found");
  }

  res.status(200).json(updated);
};

export const deleteNote = async (req, res) => {
  const { noteId } = req.params;

  const deleted = await Note.findByIdAndDelete(noteId);

  if (!deleted) {
    throw createHttpError(404, "Note not found");
  }

  res.status(200).json(deleted);
};
