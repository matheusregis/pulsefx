import { NavLink, Outlet } from 'react-router-dom';
import { Disclaimer } from './Disclaimer';

export function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <NavLink to="/" className="brand">
          Pulse FX
        </NavLink>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/favoritos">Meus indicadores</NavLink>
        </nav>
      </header>

      <main className="layout__main">
        <Outlet />
      </main>

      <footer className="layout__footer">
        <Disclaimer />
      </footer>
    </div>
  );
}
