import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/guards/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import DashboardPage from "./pages/Dashboard";
import RecordsPage from "./pages/Records";
import UsersPage from "./pages/Users";
import CategoriesPage from "./pages/Categories";
import AnalyticsPage from "./pages/Analytics";
import ExpensesByUserPage from "./pages/ExpensesByUser";
import CategoryExpensesPage from "./pages/CategoryExpenses";
import SettingsPage from "./pages/Settings";
import UnauthorizedPage from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected routes with layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN", "ANALYST", "VIEWER"]}><DashboardPage /></ProtectedRoute>} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={["ADMIN"]}><UsersPage /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute allowedRoles={["ADMIN"]}><CategoriesPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute allowedRoles={["ADMIN", "ANALYST"]}><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/analytics/by-user" element={<ProtectedRoute allowedRoles={["ADMIN", "ANALYST"]}><ExpensesByUserPage /></ProtectedRoute>} />
              <Route path="/analytics/category-expenses" element={<ProtectedRoute allowedRoles={["ADMIN", "ANALYST"]}><CategoryExpensesPage /></ProtectedRoute>} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
