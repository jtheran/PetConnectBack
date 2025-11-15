import multer from 'multer';

// Configuración de almacenamiento
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;