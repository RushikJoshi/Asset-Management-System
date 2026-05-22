import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    taskName: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const checklistSchema = new mongoose.Schema(
  {
    checkName: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const workOrderSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true, unique: true },
    complaintDate: { type: Date, required: true, default: Date.now },
    assetId: { type: String, required: true },
    assetName: { type: String, required: true },
    complaintType: { type: String, required: true },
    complaintTitle: { type: String, default: "" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    raisedBy: { type: String, required: true },
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
