import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const conndb = async () => {
  try {
    await mongoose.connect(process.env.URL);
    console.log("Connected Successfully");
  } catch (error) {
    console.error("Connection Error:", error.message);
    process.exit(1);
  }
};

export default conndb;
