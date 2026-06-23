const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "src", ".env") });

const app = require("./src/app");
const connectDB = require("./src/db/db");

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});