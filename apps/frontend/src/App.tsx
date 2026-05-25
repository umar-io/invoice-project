import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import { Login } from './pages/Login';
import SignUp from './pages/Signup';

import { Dashboard } from './pages/Dashboard';
import { SubmitInvoice } from './pages/SubmitInvoice';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { ReviewInvoice } from './pages/ReviewInvoice';
import { UserManagement } from './pages/UserManagement';
import { Bills } from './pages/Bills';
import { Receivables } from './pages/Receivables';
import { Expenses } from './pages/Expenses';
import { Contacts } from './pages/Contacts';
import Settings from './pages/Settings';
import { NotFound } from './pages/NotFound';

import { ProtectedRoute } from './pages/ProtectedRoute';

import './App.css';
// import './register.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignUp />} />

          {/* Protected routes group */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/submit-invoice" element={<SubmitInvoice />} />
            <Route path="/invoice/:id" element={<InvoiceDetail />} />
            <Route path="/invoice/:id/review" element={<ReviewInvoice />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/receivables" element={<Receivables />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch-all — 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;