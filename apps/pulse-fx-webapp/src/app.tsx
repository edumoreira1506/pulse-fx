import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/dashboard';
import './app.css';

export function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
