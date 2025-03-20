import { v2 as cloudinary } from "cloudinary";
import fs from "fs"   // fs stands for file system and it is provided by default in node

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        console.log("file is uploaded on cloudinary successfully", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // Removes the locally saved temporary file as the upload operation got failed
        return null;
    }
}


export {uploadOnCloudinary}