import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CustomerMenu from './pages/CustomerMenuPage';
import Dashboard from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import BillingPortal from './pages/BillingPortal';
import BillingHistory from './pages/BillingHistory';
import KitchenPortal from './pages/KitchenPortal';
import { AuthProvider, useAuth } from './AuthContext';

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  palette: {
    primary: {
      main: '#E23744', // Zomato-ish red
    },
    secondary: {
      main: '#F59E0B', // Amber/Yellow
    },
    background: {
      default: '#F9FAFB', // Tailwind gray-50
    },
  },
  shape: {
    borderRadius: 12,
  },
});

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective portal if unauthorized
    if (user.role === 'MANAGER') return <Navigate to="/dashboard" replace />;
    if (user.role === 'CASHIER') return <Navigate to="/dashboard" replace />;
    if (user.role === 'KITCHEN') return <Navigate to="/kitchen" replace />;
    return <Navigate to="/menu" replace />;
  }

  return children;
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/menu?table=1" replace />} />
            <Route path="/menu" element={<CustomerMenu />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'CASHIER']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/billing/history" 
              element={
                <ProtectedRoute allowedRoles={['CASHIER', 'MANAGER']}>
                  <BillingHistory />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/kitchen" 
              element={
                <ProtectedRoute allowedRoles={['KITCHEN', 'MANAGER']}>
                  <KitchenPortal />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/kot" 
              element={<Navigate to="/kitchen" replace />} 
            />
            
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
