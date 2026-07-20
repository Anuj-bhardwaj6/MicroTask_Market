import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiClock, FiCreditCard, FiMessageCircle, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";
import { Navbar } from "../../components/layout/Navbar.jsx";
import { Footer } from "../../components/layout/Footer.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card, StatCard } from "../../components/ui/Card.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { tasks } from "../../data/sampleData.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

export function LandingPage() {
  usePageTitle("Real-Time Freelance Micro Task Marketplace");

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <Navbar />
      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-700 dark:text-brand-200">Micro tasks, matched live</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-ink-950 dark:text-white sm:text-6xl">
              Real-Time Freelance Micro Task Marketplace
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-ink-600 dark:text-ink-300">
              Post urgent work, compare vetted proposals, chat in context, fund escrow, and move tasks from open to paid without switching tools.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register">
                <Button icon={FiArrowRight}>Create workspace</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary">View demo dashboards</Button>
              </Link>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-white p-3 shadow-soft dark:bg-ink-900">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1100&q=80"
              alt="Professional team coordinating digital work"
              className="h-48 w-full rounded-md object-cover sm:h-60"
            />
            <div className="grid gap-3 pt-3 sm:grid-cols-2">
              <StatCard label="Open tasks filled" value="92%" delta="Within first hour" icon={FiClock} />
              <StatCard label="Protected payments" value="$2.4M" delta="Escrow processed" icon={FiCreditCard} />
            </div>
          </motion.div>
        </section>
        <section id="how-it-works" className="border-y bg-white py-16 dark:bg-ink-900/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader eyebrow="Workflow" title="From brief to handoff in one loop">
              Every screen is designed around the real micro-task lifecycle: scope, match, collaborate, approve, and pay.
            </SectionHeader>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Post precisely", "Structured task forms collect budget, priority, skills, files, and deadlines."],
                ["Select confidently", "Application cards surface portfolio fit, ratings, proposal detail, and direct chat."],
                ["Ship transparently", "Timeline, comments, payment history, and notifications keep both sides aligned."],
              ].map(([title, body]) => (
                <Card key={title} interactive>
                  <FiCheckCircle className="h-6 w-6 text-brand-600" />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">{body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section id="talent" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Live marketplace" title="Tasks that look and behave like real work" />
          <div className="grid gap-4 lg:grid-cols-4">
            {tasks.map((task) => (
              <Card key={task.id} interactive>
                <p className="text-xs font-semibold text-brand-700 dark:text-brand-200">{task.category}</p>
                <h3 className="mt-2 min-h-14 font-semibold">{task.title}</h3>
                <p className="mt-3 text-sm text-ink-500">{task.deadline}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold">${task.budget}</span>
                  <span className="rounded bg-ink-100 px-2 py-1 text-xs dark:bg-ink-800">{task.status}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
        <section id="pricing" className="bg-ink-950 py-16 text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              [FiShield, "Verified identity", "Role-based flows, dispute controls, and admin reports."],
              [FiMessageCircle, "Contextual chat", "Conversations stay attached to tasks, files, status, and payment events."],
              [FiCreditCard, "Wallet-ready", "Balances, withdrawals, charts, and history screens are already modeled."],
            ].map(([Icon, title, body]) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/10 p-5">
                <Icon className="h-6 w-6 text-brand-200" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-300">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

