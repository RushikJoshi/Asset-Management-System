import Invoice from "../models/Invoice.js";

// Get all Invoices
export const getAllInvoices = async (req, res) => {
  try {
    const { search, date } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { invoiceNo: searchRegex },
        { poNumber: searchRegex },
        { procurer: searchRegex },
        { "products.brand": searchRegex },
        { "products.model": searchRegex },
      ];
    }

    if (date) {
      // Find invoices on/after or around this date
      const filterDate = new Date(date);
      if (!isNaN(filterDate.getTime())) {
        const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));
        query.invoiceDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const invoices = await Invoice.find(query).sort({ invoiceDate: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
