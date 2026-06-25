import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../Models/user.model.js";
import { Department } from "../Models/department.model.js";
import { DB_NAME } from "../constants.js";

dotenv.config();

const migrateUsers = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("Connected to database for user migration.");

    // Assuming existing departments in User model are short codes
    // Note: If some users already have ObjectIds or invalid data, this will try to fix them.
    const users = await User.find({});

    for (const user of users) {
      if (!user.department) continue;
      
      // Check if it's already an ObjectId
      if (mongoose.Types.ObjectId.isValid(user.department) && String(new mongoose.Types.ObjectId(user.department)) === String(user.department)) {
        continue; // Already migrated
      }

      // It's likely a short code string like "CSE"
      const shortCode = String(user.department).toUpperCase();
      const departmentRecord = await Department.findOne({ shortCode });
      
      if (departmentRecord) {
        // We use $set to bypass Mongoose schema validation during the migration in case 
        // the schema is already updated to strictly expect ObjectId but user is still string in memory
        await User.collection.updateOne(
          { _id: user._id },
          { $set: { department: departmentRecord._id } }
        );
        console.log(`Migrated user ${user.instituteId} to department ${departmentRecord.shortCode}`);
      } else {
        console.warn(`User ${user.instituteId} has unknown department short code: ${shortCode}`);
      }
    }
    
    console.log("User migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error migrating users:", error);
    process.exit(1);
  }
};

migrateUsers();
