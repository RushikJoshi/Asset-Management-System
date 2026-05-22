import WorkOrder from "../models/WorkOrder.js";

// @desc    Get all work orders
// @route   GET /api/work-orders
export const getAllWorkOrders = async (req, res) => {
  try {
    const { search, product, status } = req.query;
    let query = {};

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: "i" } },
        { assetId: { $regex: search, $options: "i" } },
        { assetName: { $regex: search, $options: "i" } },
        { complaintType: { $regex: search, $options: "i" } },
        { complaintTitle: { $regex: search, $options: "i" } },
      ];
    }

    if (product && product !== "") {
      query.assetName = { $regex: product, $options: "i" };
    }

    const workOrders = await WorkOrder.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workOrders.length,
      workOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to fetch work orders.",
      error: error.message,
    });
  }
};

// @desc    Get single work order by ID
// @route   GET /api/work-orders/:id
export const getWorkOrderById = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: "Work Order/Complaint not found.",
      });
    }

    res.status(200).json({
      success: true,
      workOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to retrieve work order.",
      error: error.message,
    });
  }
};

// @desc    Create new work order
// @route   POST /api/work-orders
export const createWorkOrder = async (req, res) => {
  try {
    const {
      assetId,
      assetName,
      complaintType,
      complaintTitle,
      priority,
      raisedBy,
      status,
      assignedTo,
      workOrderSelection,
      workOrderCost,
      tasks,
      checklists,
    } = req.body;

    // Generate unique complaint ID: Comp ID - X
    const count = await WorkOrder.countDocuments();
    const complaintId = `Comp ID - ${count + 1}`;

    const workOrder = await WorkOrder.create({
      complaintId,
      complaintDate: new Date(),
      assetId: assetId || "Asset ID - Unknown",
      assetName: assetName || "Unknown Asset",
      complaintType: complaintType || "Maintenance",
      complaintTitle: complaintTitle || "",
      priority: priority || "Medium",
      raisedBy: raisedBy || req.user?.name || "System",
      status: status || "Open",
      assignedTo: assignedTo || "",
      workOrderSelection: workOrderSelection || "",
      workOrderCost: workOrderCost || 0,
      tasks: tasks || [],
      checklists: checklists || [],
    });

    res.status(201).json({
      success: true,
      message: "Successfully created work order.",
      workOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to create work order.",
      error: error.message,
    });
  }
};

// @desc    Update work order details
// @route   PUT /api/work-orders/:id
export const updateWorkOrder = async (req, res) => {
  try {
    const {
      priority,
      assignedTo,
      workOrderSelection,
      workOrderCost,
      tasks,
      checklists,
      status,
    } = req.body;

    let workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: "Work Order not found.",
      });
    }

    // Determine the status automatically:
    // If assigned worker, tasks, or checklists exist and are updated, it should transition to "In Progress" or "Completed"
    // However, we let the frontend specify status, or fallback:
    let computedStatus = status || workOrder.status;
    if (!status) {
      if (assignedTo && workOrder.status === "Open") {
        computedStatus = "In Progress";
      }
    }

    workOrder = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          priority: priority || workOrder.priority,
          assignedTo: assignedTo !== undefined ? assignedTo : workOrder.assignedTo,
          workOrderSelection: workOrderSelection !== undefined ? workOrderSelection : workOrder.workOrderSelection,
          workOrderCost: workOrderCost !== undefined ? Number(workOrderCost) : workOrder.workOrderCost,
          tasks: tasks !== undefined ? tasks : workOrder.tasks,
          checklists: checklists !== undefined ? checklists : workOrder.checklists,
          status: computedStatus,
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Work Order updated successfully.",
      workOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to update work order.",
      error: error.message,
    });
  }
};
