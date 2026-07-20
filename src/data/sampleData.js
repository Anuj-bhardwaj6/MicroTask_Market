export const categories = [
  "Design",
  "Development",
  "Writing",
  "Marketing",
  "Operations",
  "Research",
];

// Note: client/freelancer/admin dashboard stats used to live here as static
// arrays. They're now served live from GET /api/tasks/dashboard/stats
// (see server/controllers/taskController.js) and consumed via
// useTaskStatsQuery() in src/hooks/api/useTasks.js.

export const tasks = [
  {
    id: "MT-1042",
    title: "Create responsive landing page QA report",
    category: "Development",
    budget: 320,
    deadline: "Today, 5:00 PM",
    priority: "High",
    status: "In progress",
    progress: 68,
    skills: ["React", "QA", "Accessibility"],
    client: "Northstar Labs",
    description: "Audit a new landing page across mobile breakpoints, document issues, and propose fixes with screenshots.",
  },
  {
    id: "MT-1043",
    title: "Rewrite onboarding email sequence",
    category: "Writing",
    budget: 540,
    deadline: "Tomorrow",
    priority: "Medium",
    status: "Open",
    progress: 12,
    skills: ["Lifecycle", "SaaS", "Copywriting"],
    client: "Lumen Pay",
    description: "Refresh five onboarding emails to improve activation for finance teams and reduce support tickets.",
  },
  {
    id: "MT-1044",
    title: "Design app store screenshots",
    category: "Design",
    budget: 760,
    deadline: "Jul 22",
    priority: "High",
    status: "Review",
    progress: 90,
    skills: ["Figma", "Mobile", "Brand"],
    client: "Tempo Health",
    description: "Produce polished screenshots for iOS and Android listings using existing brand guidelines.",
  },
  {
    id: "MT-1045",
    title: "Build lead list for boutique agencies",
    category: "Research",
    budget: 180,
    deadline: "Jul 24",
    priority: "Low",
    status: "Open",
    progress: 4,
    skills: ["Research", "Sheets", "CRM"],
    client: "Orbit CRM",
    description: "Find verified contacts for 150 boutique agencies in North America with company size and tech stack notes.",
  },
];

export const applicants = [
  {
    name: "Elena Rossi",
    rating: 4.98,
    skills: ["Figma", "Brand systems", "Mobile UI"],
    proposal: "I can deliver a clean screenshot set with localized variants and export-ready assets within 48 hours.",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Marcus Lee",
    rating: 4.91,
    skills: ["React", "Testing", "WCAG"],
    proposal: "I specialize in frontend QA and can provide annotated fixes with Lighthouse and keyboard testing notes.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Sofia Ahmed",
    rating: 4.95,
    skills: ["Lifecycle", "B2B SaaS", "Research"],
    proposal: "I will rewrite the sequence around activation milestones and provide subject-line variants for A/B testing.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
  },
];

export const messages = [
  { from: "Elena Rossi", text: "I uploaded the first export set and marked two screenshots for review.", time: "9:41 AM", unread: 2 },
  { from: "Northstar Labs", text: "Can you check the checkout breakpoint before handoff?", time: "8:16 AM", unread: 0 },
  { from: "Maya Chen", text: "Payment released. Great work on the QA notes.", time: "Yesterday", unread: 0 },
];

export const notifications = [
  { group: "Today", title: "New application received", body: "Elena Rossi applied to your App Store screenshot task.", unread: true },
  { group: "Today", title: "Escrow funded", body: "$760 was secured for MT-1044.", unread: true },
  { group: "Yesterday", title: "Deadline changed", body: "Northstar Labs moved review to 5:00 PM.", unread: false },
  { group: "This week", title: "Payout processed", body: "Your $486 payout was sent to Stripe Express.", unread: false },
];

export const transactions = [
  { label: "Escrow funding", amount: "-$760", date: "Jul 16", status: "Completed" },
  { label: "Task payout", amount: "+$486", date: "Jul 16", status: "Processing" },
  { label: "Platform fee", amount: "-$18", date: "Jul 15", status: "Completed" },
  { label: "Withdrawal", amount: "-$1,200", date: "Jul 14", status: "Completed" },
];

export const adminUsers = [
  { name: "Maya Chen", role: "Client", spend: "$12,640", status: "Verified" },
  { name: "Adrian Wells", role: "Freelancer", spend: "$8,210 earned", status: "Top rated" },
  { name: "Tempo Health", role: "Client", spend: "$42,180", status: "Enterprise" },
];
