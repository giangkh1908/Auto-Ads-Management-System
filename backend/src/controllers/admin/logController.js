import Log from "../../models/admin/log.model.js";
import User from "../../models/user/user.model.js";
import mongoose from "mongoose";

// Get customer logs (logs related to customers/users without internal_role)
export const getCustomerLogs = async (req, res) => {
  try {
    const { page = 1, search = "", dateRange } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    const pipeline = [
      // Filter by target_type first
      {
        $match: {
          target_type: { $in: ["User", "FacebookPage", "Campaign"] }
        }
      },
      // Lookup user info
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_info"
        }
      },
      {
        $unwind: {
          path: "$user_info",
          preserveNullAndEmptyArrays: true
        }
      },
      // Filter out internal staff logs (keep only customers or system logs related to customers)
      {
        $match: {
          $or: [
            { "user_info.internal_role": { $exists: false } },
            { "user_info.internal_role": null }
          ]
        }
      },

    ];

    // Apply Search Filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { "user_info.full_name": searchRegex },
            { "user_info.email": searchRegex },
            { description: searchRegex },
            { action: searchRegex }
          ]
        }
      });
    }

    // Apply Date Range Filter
    if (dateRange && dateRange.includes("-")) {
      const [startStr, endStr] = dateRange.split("-").map(s => s.trim());
      const parseDate = (d) => {
        const [dd, mm, yyyy] = d.split("/").map(Number);
        return new Date(yyyy, mm - 1, dd);
      };

      const startDate = parseDate(startStr);
      const endDate = parseDate(endStr);
      endDate.setHours(23, 59, 59, 999);

      pipeline.push({
        $match: {
          created_at: { $gte: startDate, $lte: endDate }
        }
      });
    }

    // Count total before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const [countResult] = await Log.aggregate(countPipeline);
    const total = countResult ? countResult.total : 0;

    // Apply Pagination and Sort
    const lastLogId = req.query.lastLogId;

    if (lastLogId && mongoose.isValidObjectId(lastLogId)) {
      // when sorting by created_at descending, fetch older logs by _id < lastLogId
      pipeline.push({ $match: { _id: { $lt: new mongoose.Types.ObjectId(lastLogId) } } });
    }
    pipeline.push(
      { $sort: { created_at: -1 } },
      { $limit: limit }
    );

    const logs = await Log.aggregate(pipeline);

    // Format logs
    const formattedLogs = logs.map((log) => {
      let roleName = "User";
      let userStatus = "Active";

      if (log.user_info) {
        userStatus = log.user_info.status === "active" ? "Active" :
          log.user_info.status === "banned" ? "Banned" : "Inactive";
      }

      return {
        _id: log._id,
        user: log.user_name || log.user_info?.full_name || "N/A",
        userId: log.user_id || "N/A",
        shopName: "N/A",
        shopId: "N/A",
        time: log.created_at,
        role: roleName,
        userStatus: userStatus,
        event: log.description || log.action || "-",
        action: log.action,
        description: log.description,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedLogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("❌ Get customer logs error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy customer logs.",
      error: error.message
    });
  }
};
