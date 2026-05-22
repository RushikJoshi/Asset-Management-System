import "dotenv/config";
import mongoose from "mongoose";
import WorkOrder from "../models/WorkOrder.js";
import Role, { ensureDefaultRoles } from "../models/Role.js";

const sampleWorkOrders = [
  // 3 Open Complaints
  {
    complaintId: "Comp ID - 10",
    complaintDate: new Date("2026-05-20T10:00:00Z"),
    assetId: "AST-202",
    assetName: "Dell Inspiron 15",
    complaintType: "Hardware",
    complaintTitle: "Keyboard keys not working",
    priority: "Low",
    raisedBy: "Mathew Manager",
    status: "Open",
    assignedTo: "",
    workOrderSelection: "Keyboard Replacement",
    workOrderCost: 0,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 4",
    complaintDate: new Date("2026-05-21T09:15:00Z"),
    assetId: "AST-305",
    assetName: "Apple iPhone 16 Pro",
    complaintType: "Software",
    complaintTitle: "Frequent crashes on boot",
    priority: "High",
    raisedBy: "Evan Employee",
    status: "Open",
    assignedTo: "",
    workOrderSelection: "OS Reinstallation",
    workOrderCost: 0,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 2",
    complaintDate: new Date("2026-05-19T14:30:00Z"),
    assetId: "AST-401",
    assetName: "Samsung Galaxy Tab S10 FE+",
    complaintType: "Hardware",
    complaintTitle: "Screen flickering issue",
    priority: "Medium",
    raisedBy: "Evan Employee",
    status: "Open",
    assignedTo: "",
    workOrderSelection: "Display Repair",
    workOrderCost: 0,
    tasks: [],
    checklists: []
  },

  // 13 In Progress Work Orders
  {
    complaintId: "Comp ID - 11",
    complaintDate: new Date("2026-05-18T11:00:00Z"),
    assetId: "AST-501",
    assetName: "MacBook Pro M3",
    complaintType: "Hardware",
    complaintTitle: "Battery draining extremely fast",
    priority: "High",
    raisedBy: "Alice Developer",
    status: "In Progress",
    assignedTo: "Thomas John",
    workOrderSelection: "Battery Replacement",
    workOrderCost: 8500,
    tasks: [
      { taskName: "Battery Diagnostic Test", description: "Run Apple Service Toolkit to verify battery health cycle count." },
      { taskName: "Hardware Replacement", description: "Open chassis and install genuine A2941 battery unit safely." }
    ],
    checklists: [
      { checkName: "Chassis Cleaned", description: "Remove dust from fans and interior casing." },
      { checkName: "Post-Install Verification", description: "Verify charging cycle and system calibration." }
    ]
  },
  {
    complaintId: "Comp ID - 12",
    complaintDate: new Date("2026-05-17T09:00:00Z"),
    assetId: "AST-502",
    assetName: "HP EliteBook 840",
    complaintType: "Software",
    complaintTitle: "Windows blue screen on startup",
    priority: "Medium",
    raisedBy: "Bob HR",
    status: "In Progress",
    assignedTo: "Albert Admin",
    workOrderSelection: "OS Diagnostics",
    workOrderCost: 1500,
    tasks: [
      { taskName: "RAM Diagnostic", description: "Run MemTest86 to check memory sticks for integrity." }
    ],
    checklists: [
      { checkName: "Disk Checked", description: "Perform CHKDSK on system drive." }
    ]
  },
  {
    complaintId: "Comp ID - 13",
    complaintDate: new Date("2026-05-17T15:20:00Z"),
    assetId: "AST-503",
    assetName: "Lenovo ThinkPad T14",
    complaintType: "Hardware",
    complaintTitle: "Overheating and shutting down",
    priority: "High",
    raisedBy: "Charlie QA",
    status: "In Progress",
    assignedTo: "Thomas John",
    workOrderSelection: "Thermal Service",
    workOrderCost: 2000,
    tasks: [
      { taskName: "Thermal Paste Re-application", description: "Clean existing paste and apply thermal Grizzly paste." }
    ],
    checklists: [
      { checkName: "Fan Functionality", description: "Ensure fan blades rotate smoothly without noise." }
    ]
  },
  {
    complaintId: "Comp ID - 14",
    complaintDate: new Date("2026-05-16T10:10:00Z"),
    assetId: "AST-504",
    assetName: "Dell Latitude 5420",
    complaintType: "Hardware",
    complaintTitle: "USB C ports not charging",
    priority: "Medium",
    raisedBy: "Diana Finance",
    status: "In Progress",
    assignedTo: "Albert Admin",
    workOrderSelection: "Motherboard Service",
    workOrderCost: 12000,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 15",
    complaintDate: new Date("2026-05-16T13:45:00Z"),
    assetId: "AST-505",
    assetName: "iPad Air 5th Gen",
    complaintType: "Hardware",
    complaintTitle: "Home button stuck",
    priority: "Low",
    raisedBy: "Ethan Marketing",
    status: "In Progress",
    assignedTo: "Thomas John",
    workOrderSelection: "Button Repair",
    workOrderCost: 1800,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 16",
    complaintDate: new Date("2026-05-15T11:30:00Z"),
    assetId: "AST-506",
    assetName: "Asus ROG Zephyrus",
    complaintType: "Hardware",
    complaintTitle: "GPU artifacts on screen",
    priority: "High",
    raisedBy: "Frank Gaming",
    status: "In Progress",
    assignedTo: "Thomas John",
    workOrderSelection: "GPU Diagnostics",
    workOrderCost: 15000,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 17",
    complaintDate: new Date("2026-05-15T16:00:00Z"),
    assetId: "AST-507",
    assetName: "Logitech MX Master 3",
    complaintType: "Hardware",
    complaintTitle: "Scroll wheel loose",
    priority: "Low",
    raisedBy: "Grace PM",
    status: "In Progress",
    assignedTo: "Albert Admin",
    workOrderSelection: "Input Device Repair",
    workOrderCost: 500,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 18",
    complaintDate: new Date("2026-05-14T09:40:00Z"),
    assetId: "AST-508",
    assetName: "Dell Inspiron 15",
    complaintType: "Hardware",
    complaintTitle: "Chassis cracked near hinge",
    priority: "Medium",
    raisedBy: "Harry HR",
    status: "In Progress",
    assignedTo: "Thomas John",
    workOrderSelection: "Hinge Repair",
    workOrderCost: 3500,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 19",
    complaintDate: new Date("2026-05-14T14:15:00Z"),
    assetId: "AST-509",
    assetName: "Sony WH-1000XM4",
    complaintType: "Hardware",
    complaintTitle: "No audio in left ear",
    priority: "Medium",
    raisedBy: "Ian Executive",
    status: "In Progress",
    assignedTo: "Albert Admin",
    workOrderSelection: "Audio Repair",
    workOrderCost: 2200,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 20",
    complaintDate: new Date("2026-05-13T10:50:00Z"),
    assetId: "AST-510",
    assetName: "Samsung Odyssey G7",
    complaintType: "Hardware",
    complaintTitle: "Dead pixels cluster",
    priority: "High",
    raisedBy: "Julia Design",
    status: "In Progress",
    assignedTo: "Thomas John",
    workOrderSelection: "Panel Replacement",
    workOrderCost: 22000,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 21",
    complaintDate: new Date("2026-05-13T12:00:00Z"),
    assetId: "AST-511",
    assetName: "Dell Inspiron 15",
    complaintType: "Software",
    complaintTitle: "Virus / Malware popup issues",
    priority: "High",
    raisedBy: "Mathew Manager",
    status: "In Progress",
    assignedTo: "Albert Admin",
    workOrderSelection: "Antivirus Clean",
    workOrderCost: 1000,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 22",
    complaintDate: new Date("2026-05-12T09:00:00Z"),
    assetId: "AST-512",
    assetName: "Apple iPhone 16 Pro",
    complaintType: "Hardware",
    complaintTitle: "Camera lens cracked",
    priority: "Medium",
    raisedBy: "Evan Employee",
    status: "In Progress",
    assignedTo: "Thomas John",
    workOrderSelection: "Camera Service",
    workOrderCost: 7500,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 23",
    complaintDate: new Date("2026-05-12T15:30:00Z"),
    assetId: "AST-513",
    assetName: "Samsung Galaxy Tab S10 FE+",
    complaintType: "Software",
    complaintTitle: "Google Play Store not opening",
    priority: "Low",
    raisedBy: "Evan Employee",
    status: "In Progress",
    assignedTo: "Albert Admin",
    workOrderSelection: "OS Reinstallation",
    workOrderCost: 800,
    tasks: [],
    checklists: []
  },

  // 6 Completed Work Orders
  {
    complaintId: "Comp ID - 24",
    complaintDate: new Date("2026-05-10T10:00:00Z"),
    assetId: "AST-601",
    assetName: "Lenovo ThinkCentre M70",
    complaintType: "Hardware",
    complaintTitle: "SMPS failed",
    priority: "High",
    raisedBy: "Ken Admin",
    status: "Completed",
    assignedTo: "Thomas John",
    workOrderSelection: "SMPS Replacement",
    workOrderCost: 4500,
    tasks: [
      { taskName: "SMPS Replacement", description: "Replaced faulty SMPS unit with genuine Corsair 450W power supply." }
    ],
    checklists: [
      { checkName: "Power Check", description: "Ensure stable power boot-up and volt rail checks." }
    ]
  },
  {
    complaintId: "Comp ID - 25",
    complaintDate: new Date("2026-05-09T11:00:00Z"),
    assetId: "AST-602",
    assetName: "MacBook Air M1",
    complaintType: "Software",
    complaintTitle: "Reset password locked out",
    priority: "High",
    raisedBy: "Leo Marketing",
    status: "Completed",
    assignedTo: "Albert Admin",
    workOrderSelection: "Access Reset",
    workOrderCost: 0,
    tasks: [
      { taskName: "Apple Configurator Reset", description: "Bypassed MDM lock and restored MacOS Monterey system firmware." }
    ],
    checklists: [
      { checkName: "MDM Profile Checked", description: "Ensured company profile is active." }
    ]
  },
  {
    complaintId: "Comp ID - 26",
    complaintDate: new Date("2026-05-08T14:00:00Z"),
    assetId: "AST-603",
    assetName: "Dell Inspiron 15",
    complaintType: "Hardware",
    complaintTitle: "RAM Upgrade to 16GB",
    priority: "Medium",
    raisedBy: "Mathew Manager",
    status: "Completed",
    assignedTo: "Thomas John",
    workOrderSelection: "RAM Upgrade",
    workOrderCost: 3200,
    tasks: [
      { taskName: "RAM Installation", description: "Installed 8GB DDR4 Crucial RAM in empty expansion slot." }
    ],
    checklists: [
      { checkName: "Dual Channel Check", description: "Confirmed DDR4 dual channel speed in BIOS." }
    ]
  },
  {
    complaintId: "Comp ID - 27",
    complaintDate: new Date("2026-05-07T09:30:00Z"),
    assetId: "AST-604",
    assetName: "Epson L3210 Printer",
    complaintType: "Hardware",
    complaintTitle: "Paper jam error permanently",
    priority: "Medium",
    raisedBy: "Mona Reception",
    status: "Completed",
    assignedTo: "Albert Admin",
    workOrderSelection: "Roller Cleaning",
    workOrderCost: 1200,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 28",
    complaintDate: new Date("2026-05-06T13:00:00Z"),
    assetId: "AST-605",
    assetName: "Crucial MX500 SSD",
    complaintType: "Hardware",
    complaintTitle: "Drive not detected in BIOS",
    priority: "High",
    raisedBy: "Nick Security",
    status: "Completed",
    assignedTo: "Thomas John",
    workOrderSelection: "SATA Cable Check",
    workOrderCost: 300,
    tasks: [],
    checklists: []
  },
  {
    complaintId: "Comp ID - 29",
    complaintDate: new Date("2026-05-05T10:45:00Z"),
    assetId: "AST-606",
    assetName: "Dell Inspiron 15",
    complaintType: "Software",
    complaintTitle: "MS Office activation failure",
    priority: "Low",
    raisedBy: "Mathew Manager",
    status: "Completed",
    assignedTo: "Albert Admin",
    workOrderSelection: "Office License Act",
    workOrderCost: 0,
    tasks: [],
    checklists: []
  }
];

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB.");

    console.log("Ensuring default roles and sidebar mappings are synchronized in MongoDB...");
    await ensureDefaultRoles();
    console.log("Default roles synchronized successfully.");

    console.log("Clearing existing work orders...");
    await WorkOrder.deleteMany({});
    console.log("Existing work orders cleared.");

    console.log(`Seeding ${sampleWorkOrders.length} sample work orders...`);
    const seeded = await WorkOrder.insertMany(sampleWorkOrders);
    console.log(`Seeded ${seeded.length} work orders successfully.`);

    await mongoose.disconnect();
    console.log("MongoDB disconnected successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding work orders:", error);
    process.exit(1);
  }
};

seed();
