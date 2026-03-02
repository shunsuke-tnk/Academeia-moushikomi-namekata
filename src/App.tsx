import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CourseDateProvider } from './context/CourseDateContext';
import ApplicationForm from './components/ApplicationForm';
import Admin from './components/Admin';

export default function App() {
  return (
    <CourseDateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ApplicationForm />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </CourseDateProvider>
  );
}
