import multer from 'multer';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadImageToImageKit = async (file) => {
    try {
        const response = await imagekit.upload({
            file: file.buffer, 
            fileName: file.originalname,
        });
        return response.url; 
    } catch (error) {
        throw new Error('Image upload failed');
    }
};

export default upload;
