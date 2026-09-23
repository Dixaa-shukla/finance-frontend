import { Navigate, Route, Routes } from 'react-router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import SettingsPage from '@/pages/SettingsPage';
import DashboardPage from '@/pages/DashboardPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ExpensesPage from '@/pages/ExpensesPage';
import IncomePage from '@/pages/IncomePage';
import CategoriesPage from '@/pages/CategoriesPage';
import BudgetsPage from '@/pages/BudgetsPage';
import GoalsPage from '@/pages/GoalsPage';
import TransactionsPage from '@/pages/TransactionsPage';
import RecurringPage from '@/pages/RecurringPage';
import InvestmentsPage from '@/pages/InvestmentsPage';
import AiAssistantPage from '@/pages/AiAssistantPage';
import AiCategorizationPage from '@/pages/AiCategorizationPage';
import AiAnalyticsPage from '@/pages/AiAnalyticsPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';

export default function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Expenses also holds AI categorization and receipt uploads. */}
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/expenses/ai-categorization" element={<AiCategorizationPage />} />
        <Route path="/expenses/receipts" element={<DocumentsPage />} />

        <Route path="/income" element={<IncomePage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/goals" element={<GoalsPage />} />

        {/* Transactions also holds the recurring rules. */}
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/recurring" element={<RecurringPage />} />

        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/ai-assistant" element={<AiAssistantPage />} />
        <Route path="/ai-analytics" element={<AiAnalyticsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Settings also holds category management. */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/categories" element={<CategoriesPage />} />

        {/* AdminPage itself explains a visit without the ADMIN role. */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Old links keep working. */}
        <Route
          path="/ai-categorization"
          element={<Navigate to="/expenses/ai-categorization" replace />}
        />
        <Route path="/documents" element={<Navigate to="/expenses/receipts" replace />} />
        <Route path="/recurring" element={<Navigate to="/transactions/recurring" replace />} />
        <Route path="/categories" element={<Navigate to="/settings/categories" replace />} />

        {/* "/" and anything unknown land on the Dashboard. */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
