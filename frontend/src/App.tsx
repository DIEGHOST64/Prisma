import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ApplyPage from './pages/ApplyPage';
import CheckStatusPage from './pages/CheckStatusPage';
import AdminDashboard from './pages/AdminDashboard';
import VacancyManagement from './pages/VacancyManagement';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/apply/:vacancyId' element={<ApplyPage />} />
          <Route path='/check-status' element={<CheckStatusPage />} />
          <Route
            path='/admin'
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/vacancies'
            element={
              <ProtectedRoute>
                <VacancyManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/users'
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
