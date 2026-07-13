import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Alert
} from '@mui/material';
import RestaurantMenuIcon from '@mui/material/Icon'; // fallback
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        
        if (data.success) {
          login(data.user);
          navigate('/dashboard');
        } else {
          setError(data.message || 'Invalid email or password');
        }
      } else {
        // Fallback local login if backend is unavailable
        if (email === 'admin@desibites.com' && password === 'password123') {
          login({ name: 'Admin User', role: 'MANAGER', email });
          navigate('/dashboard');
        } else if (email === 'cashier@desibites.com' && password === 'password123') {
          login({ name: 'Cashier User', role: 'CASHIER', email });
          navigate('/dashboard');
        } else if (email === 'kitchen@desibites.com' && password === 'password123') {
          login({ name: 'Kitchen Staff', role: 'KITCHEN', email });
          navigate('/kitchen');
        } else {
          setError('Invalid email or password (Local Fallback)');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', borderRadius: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ width: 48, height: 48, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
             <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>D</Typography>
          </Box>
          <Typography component="h1" variant="h5" fontWeight="bold">
            DesiBites Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Sign in to manage your restaurant
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: '9999px', fontSize: '1rem' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          
          <Box sx={{ mt: 2, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.02)', p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>
              Demo Credentials (Password: password123):
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Manager: <b>admin@desibites.com</b>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Cashier: <b>cashier@desibites.com</b>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Kitchen (KOT): <b>kitchen@desibites.com</b>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
