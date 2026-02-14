import multer from "multer";

// USE MEMORY STORAGE INSTEAD OF DISK STORAGE
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
});
