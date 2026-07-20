import { Navigate, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthLayout } from "./layouts/AuthLayout.jsx";
import { DashboardLayout } from "./layouts/DashboardLayout.jsx";
import { PageTransition } from "./components/common/PageTransition.jsx";
import { LandingPage } from "./pages/public/LandingPage.jsx";
import { LoginPage } from "./pages/auth/LoginPage.jsx";
import { RegisterPage } from "./pages/auth/RegisterPage.jsx";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage.jsx";
import { OtpVerificationPage } from "./pages/auth/OtpVerificationPage.jsx";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage.jsx";
import { DashboardHome } from "./pages/dashboard/DashboardHome.jsx";
import { PostTaskPage } from "./pages/dashboard/PostTaskPage.jsx";
import { TaskListPage } from "./pages/dashboard/TaskListPage.jsx";
import { TaskDetailsPage } from "./pages/dashboard/TaskDetailsPage.jsx";
import { ApplicationsPage } from "./pages/dashboard/ApplicationsPage.jsx";
import { MyApplicationsPage } from "./pages/dashboard/MyApplicationsPage.jsx";
import { ChatPage } from "./pages/dashboard/ChatPage.jsx";
import { NotificationsPage } from "./pages/dashboard/NotificationsPage.jsx";
import { WalletPage } from "./pages/dashboard/WalletPage.jsx";
import { ProfilePage } from "./pages/dashboard/ProfilePage.jsx";
import { SettingsPage } from "./pages/dashboard/SettingsPage.jsx";
import { UtilityPage } from "./pages/dashboard/UtilityPage.jsx";
import { NotFoundPage } from "./pages/public/NotFoundPage.jsx";

function RoutedPage({ children }) {
  return <PageTransition>{children}</PageTransition>;
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/otp-verification" element={<OtpVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route path="/client" element={<DashboardLayout role="client" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<RoutedPage><DashboardHome role="client" /></RoutedPage>} />
          <Route path="post-task" element={<RoutedPage><PostTaskPage /></RoutedPage>} />
          <Route path="tasks" element={<RoutedPage><TaskListPage mode="client" /></RoutedPage>} />
          <Route path="tasks/:id/edit" element={<RoutedPage><PostTaskPage /></RoutedPage>} />
          <Route path="tasks/:id" element={<RoutedPage><TaskDetailsPage role="client" /></RoutedPage>} />
          <Route path="applications" element={<RoutedPage><ApplicationsPage /></RoutedPage>} />
          <Route path="wallet" element={<RoutedPage><WalletPage /></RoutedPage>} />
          <Route path="messages" element={<RoutedPage><ChatPage /></RoutedPage>} />
          <Route path="messages/:conversationId" element={<RoutedPage><ChatPage /></RoutedPage>} />
          <Route path="notifications" element={<RoutedPage><NotificationsPage /></RoutedPage>} />
          <Route path="profile" element={<RoutedPage><ProfilePage /></RoutedPage>} />
          <Route path="settings" element={<RoutedPage><SettingsPage /></RoutedPage>} />
        </Route>

        <Route path="/freelancer" element={<DashboardLayout role="freelancer" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<RoutedPage><DashboardHome role="freelancer" /></RoutedPage>} />
          <Route path="tasks" element={<RoutedPage><TaskListPage mode="freelancer" /></RoutedPage>} />
          <Route path="tasks/:id" element={<RoutedPage><TaskDetailsPage role="freelancer" /></RoutedPage>} />
          <Route path="applied" element={<RoutedPage><MyApplicationsPage /></RoutedPage>} />
          <Route path="ongoing" element={<RoutedPage><TaskListPage mode="freelancer" assignedOnly fixedStatus="In Progress" title="Current tasks" /></RoutedPage>} />
          <Route path="completed" element={<RoutedPage><TaskListPage mode="freelancer" assignedOnly fixedStatus="Completed" title="Completed tasks" /></RoutedPage>} />
          <Route path="messages" element={<RoutedPage><ChatPage /></RoutedPage>} />
          <Route path="messages/:conversationId" element={<RoutedPage><ChatPage /></RoutedPage>} />
          <Route path="wallet" element={<RoutedPage><WalletPage /></RoutedPage>} />
          <Route path="notifications" element={<RoutedPage><NotificationsPage /></RoutedPage>} />
          <Route path="profile" element={<RoutedPage><ProfilePage /></RoutedPage>} />
          <Route path="settings" element={<RoutedPage><SettingsPage /></RoutedPage>} />
        </Route>

        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<RoutedPage><DashboardHome role="admin" /></RoutedPage>} />
          <Route path="users" element={<RoutedPage><UtilityPage title="Users" type="users" /></RoutedPage>} />
          <Route path="tasks" element={<RoutedPage><UtilityPage title="Tasks" /></RoutedPage>} />
          <Route path="payments" element={<RoutedPage><WalletPage /></RoutedPage>} />
          <Route path="categories" element={<RoutedPage><UtilityPage title="Categories" type="empty" /></RoutedPage>} />
          <Route path="reports" element={<RoutedPage><UtilityPage title="Reports" type="loading" /></RoutedPage>} />
          <Route path="disputes" element={<RoutedPage><UtilityPage title="Disputes" /></RoutedPage>} />
          <Route path="analytics" element={<RoutedPage><DashboardHome role="admin" /></RoutedPage>} />
          <Route path="settings" element={<RoutedPage><SettingsPage /></RoutedPage>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}
