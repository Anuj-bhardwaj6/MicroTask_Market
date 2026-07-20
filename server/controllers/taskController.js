import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { Application } from "../models/Application.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/activityLog.js";
import { notifyUser } from "../utils/notify.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";
import { isCloudinaryConfigured } from "../config/env.js";
import { TASK_STATUSES } from "../utils/constants.js";

function parseSkills(skills) {
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean);
  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Attaches an `isBookmarked` flag to plain task objects for the current
// user, so list/detail views can render the saved state without a
// separate round trip.
function withBookmarkFlag(taskDocs, user) {
  const list = Array.isArray(taskDocs) ? taskDocs : [taskDocs];
  const bookmarkedSet = new Set((user?.bookmarkedTasks || []).map((id) => id.toString()));
  const mapped = list.map((doc) => {
    const obj = doc.toObject ? doc.toObject() : doc;
    obj.isBookmarked = bookmarkedSet.has(obj._id.toString());
    return obj;
  });
  return Array.isArray(taskDocs) ? mapped : mapped[0];
}

function isOwnerOrAdmin(req, task) {
  if (!req.user) return false;
  if (req.user.role === "admin") return true;
  return task.client && task.client.toString() === req.user._id.toString();
}

function assertOwner(req, task) {
  if (!isOwnerOrAdmin(req, task)) {
    throw ApiError.forbidden("You do not have permission to modify this task");
  }
}

// GET /api/tasks
// Supports search, category/status/priority filters, and pagination.
// mine=true (requires auth) returns every stage owned by the caller;
// otherwise only published tasks are visible (the public marketplace view).
export const getTasks = asyncHandler(async (req, res) => {
  await Task.autoExpire();

  const {
    search,
    category,
    status,
    priority,
    stage,
    mine,
    assignedToMe,
    bookmarked,
    budgetMin,
    budgetMax,
    deadlineFrom,
    deadlineTo,
    skills,
    page = 1,
    limit = 9,
    sort = "-createdAt",
  } = req.query;

  const filter = {};

  if (mine === "true" || mine === true) {
    if (!req.user) throw ApiError.unauthorized("Sign in to view your own tasks");
    filter.client = req.user._id;
    if (stage) filter.stage = stage;
  } else if (assignedToMe === "true" || assignedToMe === true) {
    if (!req.user) throw ApiError.unauthorized("Sign in to view your assigned tasks");
    filter.assignedTo = req.user._id;
  } else if (bookmarked === "true" || bookmarked === true) {
    if (!req.user) throw ApiError.unauthorized("Sign in to view your bookmarked tasks");
    filter._id = { $in: req.user.bookmarkedTasks || [] };
    filter.stage = "published";
  } else {
    filter.stage = "published";
  }

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  if (budgetMin || budgetMax) {
    filter.budget = {};
    if (budgetMin) filter.budget.$gte = Number(budgetMin);
    if (budgetMax) filter.budget.$lte = Number(budgetMax);
  }

  if (deadlineFrom || deadlineTo) {
    filter.deadline = {};
    if (deadlineFrom) filter.deadline.$gte = new Date(deadlineFrom);
    if (deadlineTo) filter.deadline.$lte = new Date(deadlineTo);
  }

  if (skills) {
    const skillList = String(skills)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillList.length) {
      filter.skills = { $in: skillList.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i")) };
    }
  }

  if (search) {
    const regex = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ title: regex }, { description: regex }, { skills: regex }, { category: regex }];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 9));
  const skip = (pageNum - 1) * limitNum;

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(limitNum),
    Task.countDocuments(filter),
  ]);

  const tasksOut = req.user ? withBookmarkFlag(tasks, req.user) : tasks;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        tasks: tasksOut,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
      "OK"
    )
  );
});

// GET /api/tasks/dashboard/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  await Task.autoExpire();
  const role = req.user.role;
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (role === "freelancer") {
    const freelancerId = req.user._id;
    const [available, assigned, inProgress, completed, dueSoon] = await Promise.all([
      Task.countDocuments({ stage: "published", status: "Open" }),
      Task.countDocuments({ assignedTo: freelancerId }),
      Task.countDocuments({ assignedTo: freelancerId, status: "In Progress" }),
      Task.countDocuments({ assignedTo: freelancerId, status: "Completed" }),
      Task.countDocuments({
        assignedTo: freelancerId,
        status: { $in: ["Open", "In Progress"] },
        deadline: { $ne: null, $gte: now, $lte: in7d },
      }),
    ]);

    const stats = [
      { label: "Available tasks", value: String(available), delta: "Open on the marketplace" },
      { label: "Assigned to you", value: String(assigned), delta: `${inProgress} in progress` },
      { label: "Deadlines", value: String(dueSoon), delta: "Due within 7 days" },
      { label: "Completed", value: String(completed), delta: "All time" },
    ];
    return res.status(200).json(new ApiResponse(200, { stats }, "OK"));
  }

  if (role === "admin") {
    const [totalTasks, open, inProgress, completed, cancelled, expired, drafts, totalUsers, budgetAgg] =
      await Promise.all([
        Task.countDocuments({}),
        Task.countDocuments({ status: "Open", stage: "published" }),
        Task.countDocuments({ status: "In Progress" }),
        Task.countDocuments({ status: "Completed" }),
        Task.countDocuments({ status: "Cancelled" }),
        Task.countDocuments({ status: "Expired" }),
        Task.countDocuments({ stage: "draft" }),
        User.countDocuments({}),
        Task.aggregate([
          { $match: { stage: { $ne: "draft" } } },
          { $group: { _id: null, total: { $sum: "$budget" } } },
        ]),
      ]);
    const totalBudget = budgetAgg[0]?.total || 0;

    const stats = [
      { label: "Total tasks", value: String(totalTasks), delta: `${drafts} drafts` },
      { label: "Active users", value: String(totalUsers), delta: "Registered accounts" },
      { label: "Open / In progress", value: `${open} / ${inProgress}`, delta: `${expired} expired` },
      {
        label: "Marketplace GMV",
        value: `$${totalBudget.toLocaleString()}`,
        delta: `${completed} completed - ${cancelled} cancelled`,
      },
    ];
    return res.status(200).json(new ApiResponse(200, { stats }, "OK"));
  }

  // client
  const clientId = req.user._id;
  const [open, inProgress, completed, cancelled, expired, dueSoon, budgetAgg] = await Promise.all([
    Task.countDocuments({ client: clientId, status: "Open", stage: "published" }),
    Task.countDocuments({ client: clientId, status: "In Progress" }),
    Task.countDocuments({ client: clientId, status: "Completed" }),
    Task.countDocuments({ client: clientId, status: "Cancelled" }),
    Task.countDocuments({ client: clientId, status: "Expired" }),
    Task.countDocuments({
      client: clientId,
      status: { $in: ["Open", "In Progress"] },
      deadline: { $ne: null, $gte: now, $lte: in24h },
    }),
    Task.aggregate([
      { $match: { client: clientId, stage: { $ne: "draft" } } },
      { $group: { _id: null, total: { $sum: "$budget" } } },
    ]),
  ]);
  const totalBudget = budgetAgg[0]?.total || 0;
  const totalPosted = open + inProgress + completed + cancelled + expired;

  const stats = [
    { label: "Open tasks", value: String(open), delta: `${inProgress} in progress` },
    { label: "Completed", value: String(completed), delta: `${cancelled} cancelled` },
    { label: "Due within 24h", value: String(dueSoon), delta: `${expired} expired` },
    { label: "Total posted budget", value: `$${totalBudget.toLocaleString()}`, delta: `${totalPosted} tasks total` },
  ];
  res.status(200).json(new ApiResponse(200, { stats }, "OK"));
});

// GET /api/tasks/dashboard/recent
export const getRecentTasks = asyncHandler(async (req, res) => {
  await Task.autoExpire();
  const role = req.user.role;
  const limit = Math.min(20, Number(req.query.limit) || 5);

  let filter = {};
  if (role === "client") filter = { client: req.user._id };
  else if (role === "freelancer") {
    filter = { $or: [{ assignedTo: req.user._id }, { stage: "published", status: "Open" }] };
  }
  // admin: no filter, sees everything

  const tasks = await Task.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.status(200).json(new ApiResponse(200, { tasks }, "OK"));
});

// GET /api/tasks/dashboard/insights
// Real dashboard intelligence for the demo: pipeline health, category mix,
// budget benchmarks, application activity, and payment signals scoped to
// the current role.
export const getDashboardInsights = asyncHandler(async (req, res) => {
  await Task.autoExpire();

  const role = req.user.role;
  const userId = req.user._id;
  const baseFilter =
    role === "client"
      ? { client: userId }
      : role === "freelancer"
        ? { $or: [{ assignedTo: userId }, { stage: "published", status: "Open" }] }
        : {};
  const taskIdFilter =
    role === "client"
      ? { client: userId }
      : role === "freelancer"
        ? { assignedTo: userId }
        : {};

  const clientTaskIds = role === "client" ? await Task.find({ client: userId }).distinct("_id") : [];
  const applicationFilter =
    role === "freelancer"
      ? { applicant: userId }
      : role === "client"
        ? { task: { $in: clientTaskIds } }
        : {};

  const [pipeline, categoryMix, budgetAgg, applications, transactions, urgentTasks] = await Promise.all([
    Task.aggregate([
      { $match: baseFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Task.aggregate([
      { $match: { ...baseFilter, stage: { $ne: "draft" } } },
      { $group: { _id: "$category", count: { $sum: 1 }, budget: { $sum: "$budget" } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    Task.aggregate([
      { $match: { ...baseFilter, stage: { $ne: "draft" } } },
      {
        $group: {
          _id: null,
          avgBudget: { $avg: "$budget" },
          totalBudget: { $sum: "$budget" },
          maxBudget: { $max: "$budget" },
        },
      },
    ]),
    Application.aggregate([
      { $match: applicationFilter },
      { $group: { _id: "$status", count: { $sum: 1 }, avgBid: { $avg: "$bidAmount" } } },
    ]),
    Transaction.aggregate([
      {
        $match:
          role === "admin"
            ? { status: { $in: ["Completed", "Processing", "Pending"] } }
            : { user: userId, status: { $in: ["Completed", "Processing", "Pending"] } },
      },
      { $group: { _id: "$direction", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Task.find({
      ...taskIdFilter,
      status: { $in: ["Open", "In Progress"] },
      deadline: { $gte: new Date() },
    })
      .sort({ deadline: 1 })
      .limit(3)
      .select("title deadline budget status priority"),
  ]);

  const pipelineTotal = pipeline.reduce((sum, item) => sum + item.count, 0);
  const applicationTotal = applications.reduce((sum, item) => sum + item.count, 0);
  const pendingApplications = applications.find((item) => item._id === "Pending")?.count || 0;
  const acceptedApplications = applications.find((item) => item._id === "Accepted")?.count || 0;
  const avgBid =
    applicationTotal === 0
      ? 0
      : Math.round(applications.reduce((sum, item) => sum + (item.avgBid || 0) * item.count, 0) / applicationTotal);
  const budget = budgetAgg[0] || { avgBudget: 0, totalBudget: 0, maxBudget: 0 };
  const credit = transactions.find((item) => item._id === "credit")?.total || 0;
  const debit = transactions.find((item) => item._id === "debit")?.total || 0;

  const recommendations = [];
  if (role === "client" && pendingApplications > 0) {
    recommendations.push(`${pendingApplications} pending application${pendingApplications === 1 ? "" : "s"} ready to review.`);
  }
  if (role === "freelancer" && acceptedApplications > 0) {
    recommendations.push(`${acceptedApplications} accepted proposal${acceptedApplications === 1 ? "" : "s"} in your work pipeline.`);
  }
  if (urgentTasks.length > 0) {
    recommendations.push(`${urgentTasks.length} active deadline${urgentTasks.length === 1 ? "" : "s"} coming up soon.`);
  }
  if (Number(budget.avgBudget || 0) > 0) {
    recommendations.push(`Average task value is $${Math.round(budget.avgBudget).toLocaleString()}.`);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        pipeline: pipeline.map((item) => ({ status: item._id, count: item.count })),
        categoryMix: categoryMix.map((item) => ({
          category: item._id,
          count: item.count,
          budget: item.budget,
        })),
        benchmark: {
          taskCount: pipelineTotal,
          avgBudget: Math.round(budget.avgBudget || 0),
          totalBudget: budget.totalBudget || 0,
          maxBudget: budget.maxBudget || 0,
          applicationTotal,
          pendingApplications,
          avgBid,
          netFlow: credit - debit,
        },
        urgentTasks,
        recommendations: recommendations.slice(0, 4),
      },
      "OK"
    )
  );
});
export const getTaskById = asyncHandler(async (req, res) => {
  await Task.autoExpire();
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");

  if (task.stage !== "published" && !isOwnerOrAdmin(req, task)) {
    throw ApiError.forbidden("This task is not available");
  }

  const taskOut = req.user ? withBookmarkFlag(task, req.user) : task;

  res.status(200).json(new ApiResponse(200, { task: taskOut }, "OK"));
});

// PATCH /api/tasks/:id/bookmark - toggle save/unsave for the current freelancer
export const toggleBookmark = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");

  const user = req.user;
  const idx = (user.bookmarkedTasks || []).findIndex((t) => t.toString() === task._id.toString());

  let bookmarked;
  if (idx >= 0) {
    user.bookmarkedTasks.splice(idx, 1);
    bookmarked = false;
  } else {
    user.bookmarkedTasks.push(task._id);
    bookmarked = true;
  }
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, { bookmarked, taskId: task._id }, bookmarked ? "Task saved" : "Bookmark removed"));
});

// POST /api/tasks
// Creates a task as a Draft by default. Pass publish:true (or hit
// PATCH /:id/publish afterwards) to make it visible on the marketplace.
export const createTask = asyncHandler(async (req, res) => {
  const count = await Task.countDocuments();
  const taskId = `MT-${1000 + count + 1}`;
  const shouldPublish = req.body.publish === true || req.body.publish === "true";

  const task = await Task.create({
    title: req.body.title,
    description: req.body.description || "",
    category: req.body.category,
    budget: req.body.budget,
    deadline: req.body.deadline ? new Date(req.body.deadline) : null,
    priority: req.body.priority || "Medium",
    skills: parseSkills(req.body.skills),
    taskId,
    client: req.user._id,
    clientName: req.user.name,
    stage: shouldPublish ? "published" : "draft",
    status: "Open",
  });

  await logActivity(
    req.user._id,
    shouldPublish ? "Task published" : "Draft saved",
    `"${task.title}" was ${shouldPublish ? "published to the marketplace" : "saved as a draft"}.`
  );

  if (shouldPublish) {
    const io = req.app.get("io");
    await notifyUser(io, req.user._id, {
      title: "Task created",
      body: `"${task.title}" is live on the marketplace. Freelancers can start applying.`,
    });
  }

  res.status(201).json(new ApiResponse(201, { task }, shouldPublish ? "Task published" : "Draft saved"));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");
  assertOwner(req, task);

  const editable = ["title", "description", "category", "budget", "priority", "progress"];
  for (const field of editable) {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  }
  if (req.body.deadline !== undefined) {
    task.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
  }
  if (req.body.skills !== undefined) {
    task.skills = parseSkills(req.body.skills);
  }
  if (req.body.status !== undefined && TASK_STATUSES.includes(req.body.status)) {
    task.status = req.body.status;
  }

  await task.save();
  await logActivity(req.user._id, "Task updated", `"${task.title}" was edited.`);

  res.status(200).json(new ApiResponse(200, { task }, "Task updated"));
});

// PATCH /api/tasks/:id/publish - Draft -> Published
export const publishTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");
  assertOwner(req, task);

  task.stage = "published";
  if (task.status === "Expired") task.status = "Open";
  await task.save();

  await logActivity(req.user._id, "Task published", `"${task.title}" is now live for freelancers.`);

  const io = req.app.get("io");
  await notifyUser(io, req.user._id, {
    title: "Task created",
    body: `"${task.title}" is live on the marketplace. Freelancers can start applying.`,
  });

  res.status(200).json(new ApiResponse(200, { task }, "Task published"));
});

// PATCH /api/tasks/:id/archive - hides a task without deleting it
export const archiveTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");
  assertOwner(req, task);

  task.stage = "archived";
  await task.save();

  await logActivity(req.user._id, "Task archived", `"${task.title}" was archived.`);
  res.status(200).json(new ApiResponse(200, { task }, "Task archived"));
});

// PATCH /api/tasks/:id/status - move a published task through its lifecycle
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!TASK_STATUSES.includes(status)) {
    throw ApiError.badRequest(`Status must be one of: ${TASK_STATUSES.join(", ")}`);
  }

  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");

  const isAssignee = task.assignedTo && req.user && task.assignedTo.toString() === req.user._id.toString();
  if (!isOwnerOrAdmin(req, task) && !isAssignee) {
    throw ApiError.forbidden("You do not have permission to update this task's status");
  }

  task.status = status;
  if (status === "Completed") task.progress = 100;
  await task.save();

  await logActivity(req.user._id, "Status updated", `"${task.title}" moved to ${status}.`);

  // Let the other side of the task know something changed, without them
  // having to poll the task page themselves.
  const io = req.app.get("io");
  const otherPartyId = isAssignee ? task.client : task.assignedTo;
  if (otherPartyId) {
    await notifyUser(io, otherPartyId, {
      title: status === "Completed" ? "Task completed" : "Task status updated",
      body:
        status === "Completed"
          ? `"${task.title}" was marked complete. Review the work and release payment when you're ready.`
          : `"${task.title}" is now ${status}.`,
    });
  }

  res.status(200).json(new ApiResponse(200, { task }, "Task status updated"));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");
  assertOwner(req, task);

  await Promise.all(
    (task.attachments || []).map((att) =>
      deleteFromCloudinary(att.publicId, att.resourceType).catch(() => null)
    )
  );

  await task.deleteOne();
  await logActivity(req.user._id, "Task deleted", `"${task.title}" was removed.`);

  res.status(200).json(new ApiResponse(200, null, "Task deleted"));
});

// POST /api/tasks/:id/attachments (multipart/form-data, field name "files")
export const uploadAttachments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");
  assertOwner(req, task);

  if (!isCloudinaryConfigured) {
    throw ApiError.badRequest(
      "File upload isn't configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server."
    );
  }

  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest("No files were uploaded");
  }

  const uploaded = [];
  for (const file of req.files) {
    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: `microtask-marketplace/tasks/${task._id}`,
    });
    uploaded.push({
      url: result.secure_url,
      publicId: result.public_id,
      name: file.originalname,
      fileType: file.mimetype,
      resourceType: result.resource_type,
      size: file.size,
    });
  }

  task.attachments.push(...uploaded);
  await task.save();

  await logActivity(
    req.user._id,
    "Files attached",
    `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} added to "${task.title}".`
  );

  res.status(201).json(new ApiResponse(201, { attachments: task.attachments }, "Files uploaded"));
});

// DELETE /api/tasks/:id/attachments/:attachmentId
export const deleteAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");
  assertOwner(req, task);

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) throw ApiError.notFound("Attachment not found");

  await deleteFromCloudinary(attachment.publicId, attachment.resourceType).catch(() => null);
  attachment.deleteOne();
  await task.save();

  res.status(200).json(new ApiResponse(200, { attachments: task.attachments }, "Attachment removed"));
});


