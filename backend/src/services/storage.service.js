const ImageKit = require("@imagekit/nodejs");
const { toFile } = require("@imagekit/nodejs");

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY, // Replace with your actual ImageKit public key if different
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY, // Your private key
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT // Your actual ImageKit URL endpoint
});

async function uploadFile(buffer) {
    try {
        console.log("Wrapping file buffer using toFile helper...");
        const file = await toFile(buffer, "Image.jpg");

        console.log("Uploading file to ImageKit...");
        const result = await imagekit.files.upload({
            file: file,
            fileName: "Image.jpg"
        });
        return result;
    } catch (error) {
        console.error("ImageKit upload error:", error);
        throw error;
    }
}

module.exports = uploadFile;