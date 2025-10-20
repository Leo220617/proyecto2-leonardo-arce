import mongoose from 'mongoose';

const AuthorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: String
}, { timestamps: true });

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: Number,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true }
}, { timestamps: true });

export const Author = mongoose.models.Author || mongoose.model('Author', AuthorSchema);
export const Book   = mongoose.models.Book   || mongoose.model('Book', BookSchema);
