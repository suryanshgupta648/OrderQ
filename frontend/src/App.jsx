import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CustomerMenu from './components/CustomerMenu';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
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

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
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
                <ProtectedRoute requiredRole="MANAGER">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
