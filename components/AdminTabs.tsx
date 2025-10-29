import { MenuIcon, OrdersIcon, StockIcon, HistoryIcon } from './Icons';

interface AdminTabsProps {
  activeTab: 'menu' | 'commandes' | 'stock' | 'historique';
  setActiveTab: (tab: 'menu' | 'commandes' | 'stock' | 'historique') => void;
  commandesCount: number;
}

export const AdminTabs = ({ activeTab, setActiveTab, commandesCount }: AdminTabsProps) => {
  return (
    <div className="admin-tabs">
      <button 
        onClick={() => setActiveTab('menu')}
        className={`admin-tab-btn ${activeTab === 'menu' ? 'active' : ''} admin-tab-btn-flex`}
      >
        <MenuIcon active={activeTab === 'menu'} />
        <span>Gestion du Menu</span>
      </button>
      <button 
        onClick={() => setActiveTab('commandes')}
        className={`admin-tab-btn ${activeTab === 'commandes' ? 'active' : ''} admin-tab-btn-flex`}
      >
        <OrdersIcon active={activeTab === 'commandes'} />
        <span>Commandes ({commandesCount})</span>
      </button>
      <button 
        onClick={() => setActiveTab('stock')}
        className={`admin-tab-btn ${activeTab === 'stock' ? 'active' : ''} admin-tab-btn-flex`}
      >
        <StockIcon active={activeTab === 'stock'} />
        <span>Stock</span>
      </button>
      <button 
        onClick={() => setActiveTab('historique')}
        className={`admin-tab-btn ${activeTab === 'historique' ? 'active' : ''} admin-tab-btn-flex`}
      >
        <HistoryIcon active={activeTab === 'historique'} />
        <span>Historique</span>
      </button>
    </div>
  );
};