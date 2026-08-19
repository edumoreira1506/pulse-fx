import './dashboard.css';

export function DashboardPage() {
  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Dashboard</h1>
        </div>
      </header>

      <main className="app-main">
        <section className="dashboard">
          <p className="dashboard-copy">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur.
          </p>
        </section>
      </main>
    </>
  );
}

export default DashboardPage;
