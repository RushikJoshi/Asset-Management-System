import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import route from "./routes/assetRoutes.js";
import { ensureDefaultRoles } from "./models/Role.js";
import cors from "cors";

dotenv.config();

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// app.use(cors());
app.use(
  cors({
    origin: "*",
  }),
);

app.use("/api", route);

const PORT = process.env.PORT || 7001;
const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL)
  .then(async () => {
    console.log("Database connected successfully!");
    await ensureDefaultRoles();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });