const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadBase64 = async (base64String) => {
  if (!base64String) return null;
  try {
    const result = await cloudinary.uploader.upload(base64String, { 
      folder: "smartgov_complaints",
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
      width: 1200,
      crop: "limit"
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

module.exports = { uploadBase64 };
