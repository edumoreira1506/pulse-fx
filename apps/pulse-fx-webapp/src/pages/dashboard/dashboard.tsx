import { CardHistoryPanel } from '../../components/card-history-panel';
import { CardIndicator } from '../../components/card-indicator';
import { useCardDetailsSearch } from '../../data/use-card-details-search';
import { useCardHistory } from '../../data/use-card-history';
import { useCards } from '../../data/use-cards';
import {
  getHistoryPeriodOptions,
  isMonthlyCardIdentifier,
  resolveHistoryPeriod,
} from '../../utils/history-periods';
import './dashboard.css';

export function DashboardPage() {
  const { cards, loading, error, toggleFavorite } = useCards();
  const { cardId, periodParam, openCard, setPeriod, close } =
    useCardDetailsSearch();
  const selectedCard =
    cards.find((card) => card.identifier === cardId) ?? null;
  const selectedPeriod = selectedCard
    ? resolveHistoryPeriod(selectedCard.identifier, periodParam)
    : null;
  const history = useCardHistory(
    selectedCard?.identifier ?? null,
    selectedPeriod,
  );

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
                  description={card.description}
                  tooltip={card.tooltip}
                  isFavorite={card.isFavorite}
                  onOpen={() => openCard(card.identifier)}
                  onFavoriteToggle={() =>
                    toggleFavorite(card.identifier, card.isFavorite)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedCard && selectedPeriod && (
        <CardHistoryPanel
          name={selectedCard.name}
          period={selectedPeriod}
          periodOptions={getHistoryPeriodOptions(selectedCard.identifier)}
          items={history.items}
          loading={history.loading}
          error={history.error}
          isMonthly={isMonthlyCardIdentifier(selectedCard.identifier)}
          valueType={selectedCard.type}
          onPeriodChange={setPeriod}
          onClose={close}
        />
      )}
    </>
  );
}

export default DashboardPage;
