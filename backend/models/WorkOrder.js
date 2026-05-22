import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    taskName: { type: String },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const checklistSchema = new mongoose.Schema(
  {
    checkName: { type: String },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const workOrderSchema = new mongoose.Schema(
  {
    complaintId: { type: String, unique: true },
    complaintDate: { type: Date, default: Date.now },
    assetId: { type: String },
    assetName: { type: String },
    complaintType: { type: String },
    complaintTitle: { type: String, default: "" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    raisedBy: { type: String },
    status: { type: String, enum: ["Open", "In Progress", "Completed"], default: "Open" },
    assignedTo: { type: String, default: "" },
    workOrderSelection: { type: String, default: "" },
    workOrderCost: { type: Number, default: 0 },
    tasks: [taskSchema],
    checklists: [checklistSchema],
  },
  {
    timestamps: true,
  }
);

// If model exists, use it, else create it
const WorkOrder = mongoose.models.WorkOrder || mongoose.model("WorkOrder", workOrderSchema);

export default WorkOrder;
