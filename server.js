import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(express.json());

let books = [
  {
    id: 1,
    title: "War and Peace",
    author: "Leo Tolstoy",
    year: 1869,
    genre: "Novel",
    isAvailable: true,
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    year: 1949,
    genre: "Dystopian",
    isAvailable: false,
  },
];

let nextId = 3;

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);

  if (
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "PATCH"
  ) {
    console.log("Body:", req.body);
  }

  next();
});

function validateBook(book) {
  const { title, author, year, genre, isAvailable } = book;

  if (
    !title ||
    !author ||
    !year ||
    !genre ||
    typeof isAvailable !== "boolean"
  ) {
    return "All fields are required";
  }

  if (year < 1500 || year > 2025) {
    return "Year must be between 1500 and 2025";
  }

  return null;
}

app.get("/books", (req, res) => {
  let result = [...books];

  const { genre, author, available, limit, offset } = req.query;

  if (genre) {
    result = result.filter(
      (book) => book.genre.toLowerCase() === genre.toLowerCase(),
    );
  }

  if (author) {
    result = result.filter(
      (book) => book.author.toLowerCase() === author.toLowerCase(),
    );
  }

  if (available !== undefined) {
    result = result.filter(
      (book) => String(book.isAvailable) === available,
    );
  }

  const start = Number(offset) || 0;
  const end = limit ? start + Number(limit) : undefined;

  result = result.slice(start, end);

  res.json(result);
});


app.get("/books/:id", (req, res) => {
  const id = Number(req.params.id);

  const book = books.find((book) => book.id === id);

  if (!book) {
    return res.status(404).json({
      error: "Book not found",
    });
  }

  res.json(book);
});


app.get("/books/stats/genres", (req, res) => {
  const stats = {};

  books.forEach((book) => {
    stats[book.genre] = (stats[book.genre] || 0) + 1;
  });

  res.json(stats);
});


app.post("/books", (req, res) => {
  const error = validateBook(req.body);

  if (error) {
    return res.status(400).json({
      error,
    });
  }

  const newBook = {
    id: nextId++,
    ...req.body,
  };

  books.push(newBook);

  res.status(201).json(newBook);
});


app.put("/books/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = books.findIndex((book) => book.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Book not found",
    });
  }

  const error = validateBook(req.body);

  if (error) {
    return res.status(400).json({
      error,
    });
  }

  books[index] = {
    id,
    ...req.body,
  };

  res.json(books[index]);
});


app.patch("/books/:id", (req, res) => {
  const id = Number(req.params.id);

  const book = books.find((book) => book.id === id);

  if (!book) {
    return res.status(404).json({
      error: "Book not found",
    });
  }

  Object.assign(book, req.body);

  res.json(book);
});

app.delete("/books/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = books.findIndex((book) => book.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Book not found",
    });
  }

  const deletedBook = books.splice(index, 1);

  res.json({
    message: "Book deleted",
    deletedBook,
  });
});

app.post("/books/:id/borrow", (req, res) => {
  const id = Number(req.params.id);

  const book = books.find((book) => book.id === id);

  if (!book) {
    return res.status(404).json({
      error: "Book not found",
    });
  }

  book.isAvailable = false;

  res.json({
    message: "Book borrowed",
    book,
  });
});

app.post("/books/:id/return", (req, res) => {
  const id = Number(req.params.id);

  const book = books.find((book) => book.id === id);

  if (!book) {
    return res.status(404).json({
      error: "Book not found",
    });
  }

  book.isAvailable = true;

  res.json({
    message: "Book returned",
    book,
  });
});


app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});


app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});