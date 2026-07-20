import { Application } from "../models/Application.js";
import { Task } from "../models/Task.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/activityLog.js";
import { notifyUser } from "../utils/notify.js";
import { withTransaction } from "../utils/withTransaction.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";
import { isCloudinaryConfigured } from "../config/env.js";

function isTaskOwner(user, task) {
  if (!user || !task) return false;
  if (user.role === "admin") return true;
  return task.client && task.client.toString() === user._id.toString();
}

// GET /api/applications
// - mine=true            -> the caller's own applications (freelancer)
// - task=<id>             -> applicants for a single task (task owner/admin only)
// - neither, client/admin -> every application across the caller's own tasks
//   (admin sees everything)
export const getApplications = asyncHandler(async (req, res) => {
  const { task, status, mine, page = 1, limit = 50, sort = "-createdAt" } = req.query;

  if (!req.user) throw ApiError.unauthorized("Sign in to view applications");

  const filter = {};

  if (mine === "true" || mine === true) {
    filter.applicant = req.user._id;
    if (task) filter.task = task;
  } else if (task) {
    const taskDoc = await Task.findById(task);
    if (!taskDoc) throw ApiError.notFound("Task not found");
    if (!isTaskOwner(req.user, taskDoc)) {
      throw ApiError.forbidden("You do not have permission to view these applications");
    }
    filter.task = task;
  } else if (req.user.role === "admin") {
    // no filter - admins can see every application
  } else if (req.user.role === "client") {
    const myTaskIds = await Task.find({ client: req.user._id }).distinct("_id");
    filter.task = { $in: myTaskIds };
  } else {
    // freelancer without mine/task - default to their own applications
    filter.applicant = req.user._id;
  }

  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("task", "title taskId budget deadline status stage category skills clientName client")
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Application.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        applications,
        count: applications.length,
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

// POST /api/applications (multipart/form-data, field name "attachments")
// Step 2 of the hiring flow: a freelancer applies to a published, open task.
export const createApplication = asyncHandler(async (req, res) => {
  const { task: taskId, proposal, bidAmount, estimatedTime } = req.body;

  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound("Task not found");

  if (task.stage !== "published" || task.status !== "Open") {
    throw ApiError.badRequest("This task is not currently accepting applications");
  }

  if (task.client && task.client.toString() === req.user._id.toString()) {
    throw ApiError.badRequest("You can't apply to your own task");
  }

  const existing = await Application.findOne({ task: taskId, applicant: req.user._id });
  if (existing) {
    throw ApiError.conflict("You have already applied to this task");
  }

  // File uploads hit an external service (Cloudinary), so they happen
  // before the DB transaction rather than inside it.
  let attachments = [];
  if (req.files && req.files.length > 0) {
    if (!isCloudinaryConfigured) {
      throw ApiError.badRequest(
        "File upload isn't configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server."
      );
    }
    for (const file of req.files) {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: `microtask-marketplace/applications/${req.user._id}`,
      });
      attachments.push({
        url: result.secure_url,
        publicId: result.public_id,
        name: file.originalname,
        fileType: file.mimetype,
        resourceType: result.resource_type,
        size: file.size,
      });
    }
  }

  const io = req.app.get("io");

  let application;
  try {
    // Application.create + the client's notification either both land or
    // neither does, so a client can never be missing the notification for
    // an application that exists (or vice versa).
    application = await withTransaction(async (session) => {
      const [created] = await Application.create(
        [
          {
            task: taskId,
            applicant: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar,
            proposal,
            bidAmount,
            estimatedTime,
            attachments,
          },
        ],
        { session }
      );

      await notifyUser(
        io,
        task.client,
        {
          title: "New application received",
          body: `${req.user.name} applied to "${task.title}" with a bid of $${Number(bidAmount).toLocaleString()}.`,
        },
        { session }
      );
      await logActivity(req.user._id, "Application submitted", `You applied to "${task.title}".`, { session });
      await logActivity(
        task.client,
        "New application received",
        `${req.user.name} applied to "${task.title}".`,
        { session }
      );

      return created;
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw ApiError.conflict("You have already applied to this task");
    }
    throw err;
  }

  res.status(201).json(new ApiResponse(201, { application }, "Application submitted"));
});

// PATCH /api/applications/:id
// Steps 4-8 of the hiring flow, run atomically:
//   Accept -> application Accepted, task assigned + made Active ("In
//   Progress"), every other pending application on the task auto-Rejected,
//   and everyone involved (hired freelancer + auto-rejected freelancers)
//   notified.
//   Reject -> application Rejected, freelancer notified.
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  // Permission check up front, before opening a transaction.
  const preCheck = await Application.findById(req.params.id).populate("task");
  if (!preCheck) throw ApiError.notFound("Application not found");
  if (!isTaskOwner(req.user, preCheck.task)) {
    throw ApiError.forbidden("You do not have permission to update this application");
  }

  const io = req.app.get("io");

  const { application } = await withTransaction(async (session) => {
    const applicationDoc = await Application.findById(req.params.id).session(session);
    const task = await Task.findById(applicationDoc.task).session(session);
    if (!task) throw ApiError.notFound("Task not found");

    applicationDoc.status = status;
    await applicationDoc.save({ session });

    if (status === "Accepted") {
      // Task becomes Active and is handed to the accepted freelancer.
      task.assignedTo = applicationDoc.applicant;
      task.assignedToName = applicationDoc.name;
      if (task.status === "Open") task.status = "In Progress";
      await task.save({ session });

      // Everyone else still pending on this task is rejected automatically.
      const others = await Application.find({
        task: task._id,
        _id: { $ne: applicationDoc._id },
        status: "Pending",
      }).session(session);

      if (others.length) {
        await Application.updateMany(
          { _id: { $in: others.map((a) => a._id) } },
          { $set: { status: "Rejected" } },
          { session }
        );
      }

      await notifyUser(
        io,
        applicationDoc.applicant,
        {
          title: "You're hired!",
          body: `You were accepted for "${task.title}". The task is now active - you can get started.`,
        },
        { session }
      );
      await logActivity(
        applicationDoc.applicant,
        "Application accepted",
        `You were accepted for "${task.title}". The task is now assigned to you.`,
        { session }
      );
      await logActivity(
        req.user._id,
        "Applicant hired",
        `You accepted ${applicationDoc.name} for "${task.title}".`,
        { session }
      );

      for (const rejected of others) {
        await notifyUser(
          io,
          rejected.applicant,
          {
            title: "Application update",
            body: `Your application for "${task.title}" wasn't selected - the client hired someone else.`,
          },
          { session }
        );
        await logActivity(
          rejected.applicant,
          "Application update",
          `Your application for "${task.title}" was not selected.`,
          { session }
        );
      }
    } else if (status === "Rejected") {
      await notifyUser(
        io,
        applicationDoc.applicant,
        {
          title: "Application update",
          body: `Your application for "${task.title}" was not selected this time.`,
        },
        { session }
      );
      await logActivity(
        applicationDoc.applicant,
        "Application update",
        `Your application for "${task.title}" was not selected this time.`,
        { session }
      );
    }

    return { application: applicationDoc, task };
  });

  res.status(200).json(new ApiResponse(200, { application }, "Application updated"));
});

// DELETE /api/applications/:id - withdraw (freelancer, own pending application) or remove (admin)
export const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate("task", "title client");
  if (!application) throw ApiError.notFound("Application not found");

  const isOwnApplication = application.applicant.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwnApplication && !isAdmin) {
    throw ApiError.forbidden("You do not have permission to withdraw this application");
  }

  if (isOwnApplication && !isAdmin && application.status !== "Pending") {
    throw ApiError.badRequest("Only pending applications can be withdrawn");
  }

  const io = req.app.get("io");
  const taskTitle = application.task?.title || "a task";
  const clientId = application.task?.client;

  await withTransaction(async (session) => {
    await Application.deleteOne({ _id: application._id }).session(session);

    if (isOwnApplication) {
      await logActivity(
        req.user._id,
        "Application withdrawn",
        `You withdrew your application for "${taskTitle}".`,
        { session }
      );
      if (clientId) {
        await notifyUser(
          io,
          clientId,
          {
            title: "Application withdrawn",
            body: `${req.user.name} withdrew their application for "${taskTitle}".`,
          },
          { session }
        );
      }
    }
  });

  // Cloudinary cleanup is external I/O, so it happens after the DB
  // transaction has committed.
  await Promise.all(
    (application.attachments || []).map((att) =>
      deleteFromCloudinary(att.publicId, att.resourceType).catch(() => null)
    )
  );

  res.status(200).json(new ApiResponse(200, null, "Application withdrawn"));
});
