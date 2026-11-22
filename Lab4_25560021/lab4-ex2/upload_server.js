const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 5001;

// Enable CORS for client calls
app.use(cors());

// Serve frontend HTML directly on port 5001 (bypasses Live Server connection issues)
app.use(express.static(__dirname));

// Absolute path to uploads directory; create if missing[cite: 9]
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Serve /uploads folder statically for browser preview[cite: 3, 9]
app.use('/uploads', express.static(UPLOAD_DIR));

// Configure Multer Disk Storage[cite: 9]
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter: accept JPG, PNG, WEBP only[cite: 9]
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error('Only image files are accepted (JPG, PNG, WEBP)!');
        error.status = 400;
        cb(error, false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB maximum size limit[cite: 9]
    fileFilter: fileFilter
});

// 1. POST: Upload single avatar image[cite: 9]
app.post('/api/v1/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please choose an image file!' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
        success: true,
        message: 'Image uploaded successfully',
        fileInfo: {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: fileUrl
        }
    });
});

// 2. GET: Download file (Forces browser "Save As" dialog)[cite: 10, 11]
app.get('/api/v1/download/:filename', (req, res) => {
    // Security tip: path.basename prevents directory traversal attacks (e.g. ../server.js)[cite: 11]
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.download(filePath, safeFilename);
});

// 3. GET: List all uploaded files[cite: 10, 11]
app.get('/api/v1/files', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Unable to scan directory' });
        }

        const host = `${req.protocol}://${req.get('host')}`;
        const fileList = files.map(file => {
            const stats = fs.statSync(path.join(UPLOAD_DIR, file));
            return {
                filename: file,
                size: stats.size,
                url: `${host}/uploads/${file}`,
                downloadUrl: `${host}/api/v1/download/${file}`
            };
        });

        res.json({ success: true, data: fileList });
    });
});

// 4. DELETE: Remove file by filename[cite: 11]
app.delete('/api/v1/files/:filename', (req, res) => {
    const safeFilename = path.basename(req.params.filename); // Security sanitization[cite: 11]
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not delete file' });
        }
        res.json({ success: true, message: `Deleted file ${safeFilename}` });
    });
});

// Express & Multer error handling middleware[cite: 10]
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'The file is too large (max 2 MB)!'
            : err.message;
        return res.status(400).json({ success: false, message });
    }
    res.status(err.status || 500).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
    console.log(`Upload server running on port ${PORT}`);
});