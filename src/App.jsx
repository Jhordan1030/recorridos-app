import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Alert from './components/Alert';
import Dashboard from './pages/Dashboard';
import Ninos from './pages/Ninos';
import Vehiculos from './pages/Vehiculos';
import Recorridos from './pages/Recorridos';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Alert />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ninos" element={<Ninos />} />
              <Route path="/vehiculos" element={<Vehiculos />} />
              <Route path="/recorridos" element={<Recorridos />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
