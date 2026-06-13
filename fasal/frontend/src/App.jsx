import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Plan from './pages/Plan';
import Grow from './pages/Grow';
import Sell from './pages/Sell';
import History from './pages/History';
import Profile from './pages/Profile';
import T35Challenge from './pages/T35Challenge';
import IoT from './pages/IoT';
import LanguageSwitcher from './components/LanguageSwitcher';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('fasal_token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/challenge/t35" element={<T35Challenge />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route index element={<Plan />} />
          <Route path="plan" element={<Plan />} />
          <Route path="grow" element={<Grow />} />
          <Route path="sell" element={<Sell />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile />} />
          <Route path="iot" element={<IoT />} />
        </Route>
      </Routes>
      <LanguageSwitcher />
    </BrowserRouter>
  );
}
