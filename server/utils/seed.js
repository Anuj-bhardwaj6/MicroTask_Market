// Seeds MongoDB with a richer, realistic demo marketplace. Run with: npm run seed
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { Application } from "../models/Application.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { Transaction } from "../models/Transaction.js";
import { Wallet } from "../models/Wallet.js";

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

const sampleUsers = [
  {
    name: "Maya Chen",
    email: "maya@northstar.co",
    password: "password123",
    role: "client",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Jon Bell",
    email: "jon@lumenpay.io",
    password: "password123",
    role: "client",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Adrian Wells",
    email: "adrian@studio.io",
    password: "password123",
    role: "freelancer",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Elena Rossi",
    email: "elena@pixelcraft.dev",
    password: "password123",
    role: "freelancer",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Sofia Ahmed",
    email: "sofia@copylab.co",
    password: "password123",
    role: "freelancer",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Marcus Lee",
    email: "marcus@qaops.dev",
    password: "password123",
    role: "freelancer",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Nora Patel",
    email: "nora@microtask.com",
    password: "password123",
    role: "admin",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=160&q=80",
  },
];

async function seed() {
  await connectDB();

  console.log("[seed] clearing existing collections...");
  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    Application.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    Transaction.deleteMany({}),
    Wallet.deleteMany({}),
  ]);

  console.log("[seed] inserting users...");
  const users = await User.create(sampleUsers);
  const byEmail = (email) => users.find((u) => u.email === email);
  const maya = byEmail("maya@northstar.co");
  const jon = byEmail("jon@lumenpay.io");
  const adrian = byEmail("adrian@studio.io");
  const elena = byEmail("elena@pixelcraft.dev");
  const sofia = byEmail("sofia@copylab.co");
  const marcus = byEmail("marcus@qaops.dev");

  console.log("[seed] inserting tasks...");
  const sampleTasks = [
    {
      taskId: "MT-1042",
      title: "Create responsive landing page QA report",
      category: "Development",
      budget: 320,
      deadline: daysFromNow(0.2),
      priority: "High",
      stage: "published",
      status: "In Progress",
      progress: 68,
      skills: ["React", "QA", "Accessibility"],
      description: "Audit a new landing page across mobile breakpoints, document issues, and propose fixes with screenshots.",
      client: maya._id,
      clientName: maya.name,
      assignedTo: marcus._id,
      assignedToName: marcus.name,
      escrow: { status: "held", amount: 320, currency: "usd", heldAt: hoursAgo(12) },
    },
    {
      taskId: "MT-1043",
      title: "Rewrite onboarding email sequence",
      category: "Writing",
      budget: 540,
      deadline: daysFromNow(1),
      priority: "Medium",
      stage: "published",
      status: "Open",
      progress: 12,
      skills: ["Lifecycle", "SaaS", "Copywriting"],
      description: "Refresh five onboarding emails to improve activation for finance teams and reduce support tickets.",
      client: jon._id,
      clientName: jon.name,
    },
    {
      taskId: "MT-1044",
      title: "Design app store screenshots",
      category: "Design",
      budget: 760,
      deadline: daysFromNow(4),
      priority: "High",
      stage: "published",
      status: "In Progress",
      progress: 90,
      skills: ["Figma", "Mobile", "Brand"],
      description: "Produce polished screenshots for iOS and Android listings using existing brand guidelines.",
      client: maya._id,
      clientName: maya.name,
      assignedTo: elena._id,
      assignedToName: elena.name,
      escrow: { status: "held", amount: 760, currency: "usd", heldAt: hoursAgo(26) },
    },
    {
      taskId: "MT-1045",
      title: "Build lead list for boutique agencies",
      category: "Research",
      budget: 180,
      deadline: daysFromNow(6),
      priority: "Low",
      stage: "published",
      status: "Open",
      progress: 4,
      skills: ["Research", "Sheets", "CRM"],
      description: "Find verified contacts for 150 boutique agencies in North America with company size and tech stack notes.",
      client: maya._id,
      clientName: maya.name,
    },
    {
      taskId: "MT-1046",
      title: "Competitor pricing teardown",
      category: "Marketing",
      budget: 240,
      deadline: daysFromNow(-2),
      priority: "Medium",
      stage: "published",
      status: "Expired",
      progress: 0,
      skills: ["Pricing", "Research"],
      description: "Comparative breakdown of five competitor pricing pages with screenshots and positioning notes.",
      client: jon._id,
      clientName: jon.name,
    },
    {
      taskId: "MT-1047",
      title: "Migrate changelog to Notion",
      category: "Operations",
      budget: 150,
      deadline: daysFromNow(10),
      priority: "Low",
      stage: "published",
      status: "Completed",
      progress: 100,
      skills: ["Notion", "Docs"],
      description: "Move the last twelve months of release notes into a structured Notion changelog.",
      client: maya._id,
      clientName: maya.name,
      assignedTo: adrian._id,
      assignedToName: adrian.name,
      paymentReleased: true,
      escrow: { status: "released", amount: 150, currency: "usd", heldAt: daysFromNow(-8), releasedAt: daysFromNow(-3) },
    },
    {
      taskId: "MT-1048",
      title: "Customer support macro cleanup",
      category: "Operations",
      budget: 420,
      deadline: daysFromNow(3),
      priority: "Medium",
      stage: "published",
      status: "In Progress",
      progress: 45,
      skills: ["Zendesk", "Support Ops", "Writing"],
      description: "Review and rewrite 35 outdated support macros, tagging each by intent and escalation path.",
      client: jon._id,
      clientName: jon.name,
      assignedTo: adrian._id,
      assignedToName: adrian.name,
      escrow: { status: "held", amount: 420, currency: "usd", heldAt: hoursAgo(30) },
    },
    {
      taskId: "MT-1049",
      title: "Draft: Internal tools accessibility pass",
      category: "Development",
      budget: 420,
      deadline: daysFromNow(14),
      priority: "Medium",
      stage: "draft",
      status: "Open",
      progress: 0,
      skills: ["WCAG", "React"],
      description: "Not yet published - still finalizing scope and acceptance criteria before posting.",
      client: maya._id,
      clientName: maya.name,
    },
    {
      taskId: "MT-1050",
      title: "Create investor one-page metrics snapshot",
      category: "Design",
      budget: 650,
      deadline: daysFromNow(2),
      priority: "High",
      stage: "published",
      status: "Open",
      progress: 8,
      skills: ["Data viz", "Figma", "Pitch decks"],
      description: "Turn raw KPI notes into a board-ready one-page snapshot with clean visual hierarchy.",
      client: maya._id,
      clientName: maya.name,
    },
    {
      taskId: "MT-1051",
      title: "Record fintech app walkthrough script",
      category: "Marketing",
      budget: 380,
      deadline: daysFromNow(5),
      priority: "Medium",
      stage: "published",
      status: "Open",
      progress: 0,
      skills: ["Product marketing", "Scriptwriting", "Fintech"],
      description: "Draft a concise voiceover script for a two-minute product demo aimed at finance operators.",
      client: jon._id,
      clientName: jon.name,
    },
    {
      taskId: "MT-1052",
      title: "Clean survey responses and tag themes",
      category: "Research",
      budget: 290,
      deadline: daysFromNow(7),
      priority: "Low",
      stage: "published",
      status: "Open",
      progress: 0,
      skills: ["Research", "Spreadsheets", "Tagging"],
      description: "Normalize 600 survey responses and create sentiment/theme tags for product planning.",
      client: maya._id,
      clientName: maya.name,
    },
    {
      taskId: "MT-1053",
      title: "Build Stripe webhook smoke test checklist",
      category: "Development",
      budget: 480,
      deadline: daysFromNow(9),
      priority: "High",
      stage: "published",
      status: "Open",
      progress: 0,
      skills: ["Stripe", "Node.js", "QA"],
      description: "Create a reproducible checklist for checkout, webhook retry, refund, and escrow release testing.",
      client: jon._id,
      clientName: jon.name,
    },
    {
      taskId: "MT-1054",
      title: "Localize pricing page into Bengali",
      category: "Writing",
      budget: 210,
      deadline: daysFromNow(8),
      priority: "Medium",
      stage: "published",
      status: "Completed",
      progress: 100,
      skills: ["Localization", "Bengali", "SaaS"],
      description: "Translate and adapt pricing page copy for a Bangladesh market experiment.",
      client: jon._id,
      clientName: jon.name,
      assignedTo: sofia._id,
      assignedToName: sofia.name,
      paymentReleased: true,
      escrow: { status: "released", amount: 210, currency: "usd", heldAt: daysFromNow(-7), releasedAt: daysFromNow(-1) },
    },
    {
      taskId: "MT-1055",
      title: "Archived: Duplicate brand audit",
      category: "Marketing",
      budget: 300,
      deadline: daysFromNow(8),
      priority: "Low",
      stage: "archived",
      status: "Cancelled",
      progress: 0,
      skills: ["Brand"],
      description: "Duplicate of an audit already scoped internally - archived before assignment.",
      client: maya._id,
      clientName: maya.name,
    },
  ];
  const tasks = await Task.create(sampleTasks);
  const findTask = (taskId) => tasks.find((t) => t.taskId === taskId);

  console.log("[seed] inserting applications...");
  await Application.create([
    {
      task: findTask("MT-1043")._id,
      applicant: adrian._id,
      name: adrian.name,
      avatar: adrian.avatar,
      rating: 4.91,
      skills: ["Lifecycle", "SaaS", "Copywriting"],
      proposal: "I'll rewrite the sequence around activation milestones and provide subject-line variants for A/B testing.",
      bidAmount: 500,
      estimatedTime: "4 days",
      status: "Pending",
    },
    {
      task: findTask("MT-1043")._id,
      applicant: sofia._id,
      name: sofia.name,
      avatar: sofia.avatar,
      rating: 4.95,
      skills: ["Lifecycle", "B2B SaaS", "Research"],
      proposal: "I can map each email to a funnel event and include two optional branches for inactive users.",
      bidAmount: 540,
      estimatedTime: "3 days",
      status: "Pending",
    },
    {
      task: findTask("MT-1044")._id,
      applicant: elena._id,
      name: elena.name,
      avatar: elena.avatar,
      rating: 4.98,
      skills: ["Figma", "Brand systems", "Mobile UI"],
      proposal: "I can deliver a clean screenshot set with localized variants and export-ready assets within 48 hours.",
      bidAmount: 740,
      estimatedTime: "2 days",
      status: "Accepted",
    },
    {
      task: findTask("MT-1045")._id,
      applicant: adrian._id,
      name: adrian.name,
      avatar: adrian.avatar,
      rating: 4.91,
      skills: ["Research", "Sheets", "CRM"],
      proposal: "I can build a verified, enriched lead list with company size and tech stack notes within a week.",
      bidAmount: 160,
      estimatedTime: "5 days",
      status: "Rejected",
    },
    {
      task: findTask("MT-1050")._id,
      applicant: elena._id,
      name: elena.name,
      avatar: elena.avatar,
      rating: 4.98,
      skills: ["Data viz", "Figma"],
      proposal: "I will convert your rough metrics into an executive-ready layout with editable charts.",
      bidAmount: 620,
      estimatedTime: "2 days",
      status: "Pending",
    },
    {
      task: findTask("MT-1053")._id,
      applicant: marcus._id,
      name: marcus.name,
      avatar: marcus.avatar,
      rating: 4.97,
      skills: ["Stripe", "Node.js", "QA"],
      proposal: "I have tested webhook-heavy payment systems and can document retry, refund, and release scenarios.",
      bidAmount: 450,
      estimatedTime: "4 days",
      status: "Pending",
    },
  ]);

  adrian.bookmarkedTasks = [findTask("MT-1043")._id, findTask("MT-1050")._id, findTask("MT-1053")._id];
  await adrian.save({ validateBeforeSave: false });

  console.log("[seed] inserting notifications and activity...");
  await Notification.create([
    { user: maya._id, type: "notification", group: "Today", title: "New application received", body: "Elena Rossi applied to your investor metrics snapshot.", unread: true, createdAt: hoursAgo(1) },
    { user: maya._id, type: "notification", group: "Today", title: "Escrow funded", body: "$760 was secured for MT-1044.", unread: true, createdAt: hoursAgo(4) },
    { user: maya._id, type: "notification", group: "Yesterday", title: "Deadline changed", body: "Northstar Labs moved review to 5:00 PM.", unread: false, createdAt: hoursAgo(25) },
    { user: adrian._id, type: "notification", group: "Today", title: "Application update", body: "Your application for Build lead list for boutique agencies was not selected this time.", unread: true, createdAt: hoursAgo(2) },
    { user: adrian._id, type: "notification", group: "This week", title: "Profile viewed", body: "Northstar Labs viewed your profile after your latest application.", unread: false, createdAt: hoursAgo(40) },
    { user: jon._id, type: "notification", group: "Today", title: "New QA proposal", body: "Marcus Lee applied to your Stripe webhook checklist.", unread: true, createdAt: hoursAgo(3) },
    { user: maya._id, type: "activity", group: "Today", title: "Task published", body: "Create investor one-page metrics snapshot is now live for freelancers.", unread: false, createdAt: hoursAgo(1) },
    { user: maya._id, type: "activity", group: "Today", title: "Status updated", body: "Create responsive landing page QA report moved to In Progress.", unread: false, createdAt: hoursAgo(6) },
    { user: maya._id, type: "activity", group: "Yesterday", title: "Files attached", body: "2 files added to Design app store screenshots.", unread: false, createdAt: hoursAgo(22) },
    { user: adrian._id, type: "activity", group: "Today", title: "Task assigned", body: "Customer support macro cleanup is now assigned to you.", unread: false, createdAt: hoursAgo(7) },
    { user: jon._id, type: "activity", group: "Today", title: "Application received", body: "Marcus Lee submitted a bid for Stripe webhook smoke testing.", unread: false, createdAt: hoursAgo(3) },
  ]);

  console.log("[seed] inserting conversations...");
  const conversation = await Conversation.create({
    participants: [jon._id, adrian._id],
    task: findTask("MT-1043")._id,
    lastMessage: "Sounds good - I'll get started right away if selected.",
    lastMessageAt: new Date(),
    lastSender: adrian._id,
    unreadCounts: { [jon._id.toString()]: 1 },
  });
  await Message.create([
    { conversation: conversation._id, sender: jon._id, text: "Hi! Thanks for applying - could you share a quick timeline?", readBy: [jon._id, adrian._id] },
    { conversation: conversation._id, sender: adrian._id, text: "Of course. I can have a first draft ready in 4 days.", readBy: [jon._id, adrian._id] },
    { conversation: conversation._id, sender: jon._id, text: "Perfect, that works for us.", readBy: [jon._id, adrian._id] },
    { conversation: conversation._id, sender: adrian._id, text: "Sounds good - I'll get started right away if selected.", readBy: [adrian._id] },
  ]);

  console.log("[seed] inserting transactions and wallets...");
  await Transaction.create([
    { user: maya._id, task: findTask("MT-1044")._id, type: "payment", direction: "debit", label: "Escrow funded - Design app store screenshots", amount: 760, status: "Completed", method: "dev-simulated", createdAt: hoursAgo(26) },
    { user: maya._id, task: findTask("MT-1042")._id, type: "payment", direction: "debit", label: "Escrow funded - Landing page QA report", amount: 320, status: "Completed", method: "dev-simulated", createdAt: hoursAgo(12) },
    { user: maya._id, task: findTask("MT-1047")._id, type: "escrow_release", direction: "debit", label: "Escrow released - Migrate changelog to Notion", amount: 150, status: "Completed", method: "escrow", createdAt: daysFromNow(-3) },
    { user: jon._id, task: findTask("MT-1048")._id, type: "payment", direction: "debit", label: "Escrow funded - Customer support macro cleanup", amount: 420, status: "Completed", method: "dev-simulated", createdAt: hoursAgo(30) },
    { user: jon._id, task: findTask("MT-1054")._id, type: "escrow_release", direction: "debit", label: "Escrow released - Bengali pricing localization", amount: 210, status: "Completed", method: "escrow", createdAt: daysFromNow(-1) },
    { user: adrian._id, task: findTask("MT-1047")._id, type: "escrow_release", direction: "credit", label: "Task payout - Migrate changelog to Notion", amount: 150, status: "Completed", method: "escrow", createdAt: daysFromNow(-3) },
    { user: adrian._id, type: "withdrawal", direction: "debit", label: "Withdrawal request (bank transfer)", amount: 80, status: "Processing", method: "bank_transfer", createdAt: hoursAgo(5) },
    { user: sofia._id, task: findTask("MT-1054")._id, type: "escrow_release", direction: "credit", label: "Task payout - Bengali pricing localization", amount: 210, status: "Completed", method: "escrow", createdAt: daysFromNow(-1) },
    { user: elena._id, type: "adjustment", direction: "credit", label: "Manual bonus - rush design availability", amount: 75, status: "Completed", method: "admin", createdAt: hoursAgo(9) },
  ]);
  await Wallet.create([
    { user: maya._id, balance: 0, totalSpent: 1230 },
    { user: jon._id, balance: 0, totalSpent: 630 },
    { user: adrian._id, balance: 70, totalEarned: 150, totalWithdrawn: 0 },
    { user: elena._id, balance: 75, totalEarned: 75, totalWithdrawn: 0 },
    { user: sofia._id, balance: 210, totalEarned: 210, totalWithdrawn: 0 },
    { user: marcus._id, balance: 0, totalEarned: 0, totalWithdrawn: 0 },
  ]);

  console.log("[seed] done. Demo logins all use password123.");
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
