import { NavLink, Outlet } from 'react-router-dom';
import { Disclaimer } from './Disclaimer';

export function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <NavLink to="/" className="brand">
          <span className="brand__mark">⚡</span> Pulse FX
        </NavLink>
        <nav className="layout__nav">
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

      <nav className="bottom-nav" aria-label="Navegação principal">
        <NavLink to="/" end className="bottom-nav__item">
          <span aria-hidden="true">📊</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/favoritos" className="bottom-nav__item">
          <span aria-hidden="true">★</span>
          <span>Favoritos</span>
        </NavLink>
      </nav>
    </div>
  );
}
