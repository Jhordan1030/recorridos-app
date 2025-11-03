// src/App.jsx
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
          <Alert />
          {/* Este es el contenedor CRÍTICO para el layout lateral */}
          <div className="app-layout">
            <Navbar />
            {/* Este es el contenedor que lleva el fondo de color y el scroll */}
            <div className="main-content-wrapper">
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
          </div>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;