import multer from "multer";

// USE MEMORY STORAGE INSTEAD OF DISK STORAGE
const storage = multer.memoryStorage();

// The whole file is held in RAM and then base64'd (~1.37x) into the request
// body, so an unbounded upload is a memory-exhaustion risk, not just a slow
// request. 8MB is comfortably more than a phone screenshot or photo needs.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const createUpload = ({ allowedMimePrefixes, rejectedTypeMessage }) =>
  multer({
    storage,
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
      const isAllowed = allowedMimePrefixes.some((prefix) =>
        file.mimetype?.startsWith(prefix)
      );

      if (!isAllowed) {
        const error = new Error(rejectedTypeMessage);
        error.statusCode = 400;
        return cb(error);
      }

      cb(null, true);
    },
  });

export const uploadImage = createUpload({
  allowedMimePrefixes: ["image/"],
  rejectedTypeMessage: "Only image files can be uploaded",
});

export const uploadAudio = createUpload({
  allowedMimePrefixes: ["audio/"],
  rejectedTypeMessage: "Only audio files can be uploaded",
});

// Backward-compatible alias used by existing image upload routes.
export const upload = uploadImage;

export { MAX_UPLOAD_BYTES };
