import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "./models/Role.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("Database connected successfully!");
    const roles = await Role.find({});
    console.log("ROLES IN DB:");
    roles.forEach(r => {
      console.log(`- Key: ${r.key}`);
      console.log(`  Label: ${r.label}`);
      console.log(`  SidebarAccess:`, r.sidebarAccess);
      console.log(`  Access:`, r.access);
    });
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
