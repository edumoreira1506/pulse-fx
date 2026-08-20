import { CardIndicator } from '../../components/card-indicator';
import { useCards } from '../../data/use-cards';
import './dashboard.css';

export function DashboardPage() {
  const { cards, loading, error } = useCards();

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Dashboard - Pulse FX</h1>
        </div>
      </header>

      <main className="app-main">
        <section className="dashboard">
          <p className="dashboard-copy">
            Mercados e indicadores macroeconômicos
          </p>
          {loading && <p className="dashboard-status">Carregando...</p>}
          {error && <p className="dashboard-status">{error}</p>}
          {!loading && !error && (
            <div className="dashboard-cards">
              {cards.map((card) => (
                <CardIndicator
                  key={card.name}
                  name={card.name}
                  type={card.type}
                  price={card.price}
                  percentage={card.percentage}
                  indicator={card.indicator}
                  referenceDate={card.referenceDate}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default DashboardPage;
