import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { IndicatorDetail } from './pages/IndicatorDetail';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/favoritos" element={<Dashboard onlyFavorites />} />
        <Route path="/indicadores/:code" element={<IndicatorDetail />} />
      </Route>
    </Routes>
  );
}
