import multer from "multer";

// USE MEMORY STORAGE INSTEAD OF DISK STORAGE
const storage = multer.memoryStorage();

// The whole file is held in RAM and then base64'd (~1.37x) into the request
// body, so an unbounded upload is a memory-exhaustion risk, not just a slow
// request. 8MB is comfortably more than a phone screenshot or photo needs.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image files can be uploaded"));
    }
    cb(null, true);
  },
});

export { MAX_UPLOAD_BYTES };
