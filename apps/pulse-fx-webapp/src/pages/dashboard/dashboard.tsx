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
  const {
    cardId,
    periodParam,
    showFavoritesOnly,
    openCard,
    setPeriod,
    close,
    setTab,
  } = useCardDetailsSearch();
  const selectedCard =
    cards.find((card) => card.identifier === cardId) ?? null;
  const selectedPeriod = selectedCard
    ? resolveHistoryPeriod(selectedCard.identifier, periodParam)
    : null;
  const history = useCardHistory(
    selectedCard?.identifier ?? null,
    selectedPeriod,
  );
  const visibleCards = showFavoritesOnly
    ? cards.filter((card) => card.isFavorite)
    : cards;

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Dashboard - Pulse FX</h1>
        </div>
      </header>

      <main className="app-main">
        <section className="dashboard">
          <div className="dashboard-toolbar">
            <p className="dashboard-copy">
              Mercados e indicadores macroeconômicos
            </p>
            <div
              className="dashboard-tabs"
              role="tablist"
              aria-label="Filtro de indicadores"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!showFavoritesOnly}
                className={`dashboard-tab${!showFavoritesOnly ? ' is-active' : ''}`}
                onClick={() => setTab('todos')}
              >
                Todos indicadores
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={showFavoritesOnly}
                className={`dashboard-tab${showFavoritesOnly ? ' is-active' : ''}`}
                onClick={() => setTab('favoritos')}
              >
                Favoritos
              </button>
            </div>
          </div>
          {loading && <p className="dashboard-status">Carregando...</p>}
          {error && <p className="dashboard-status">{error}</p>}
          {!loading && !error && showFavoritesOnly && visibleCards.length === 0 && (
            <p className="dashboard-status">
              Nenhum indicador em Favoritos. Marque o coração em um card para
              salvá-lo.
            </p>
          )}
          {!loading && !error && visibleCards.length > 0 && (
            <div className="dashboard-cards">
              {visibleCards.map((card) => (
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

      <footer className="app-disclaimer">
        Informação educacional. Não constitui recomendação de investimento.
      </footer>

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
          price={selectedCard.price}
          percentage={selectedCard.percentage}
          indicator={selectedCard.indicator}
          referenceDate={selectedCard.referenceDate}
          description={selectedCard.description}
          limitations={selectedCard.limitations}
          onPeriodChange={setPeriod}
          onClose={close}
        />
      )}
    </>
  );
}

export default DashboardPage;
