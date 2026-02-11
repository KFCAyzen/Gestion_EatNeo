import { MenuIcon, OrdersIcon, StockIcon, HistoryIcon, TrendingUpIcon } from './Icons';

interface AdminTabsProps {
  activeTab: 'menu' | 'commandes' | 'stock' | 'historique' | 'rentabilite' | 'users';
  setActiveTab: (tab: 'menu' | 'commandes' | 'stock' | 'historique' | 'rentabilite' | 'users') => void;
  commandesCount: number;
  userRole: 'superadmin' | 'admin' | 'user';
}

export const AdminTabs = ({ activeTab, setActiveTab, commandesCount, userRole }: AdminTabsProps) => {
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
        <span>Stock & Ingrédients</span>
      </button>
      {userRole === 'superadmin' && (
        <button 
          onClick={() => setActiveTab('users')}
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''} admin-tab-btn-flex`}
        >
          <span>Utilisateurs</span>
        </button>
      )}
      {(userRole === 'admin' || userRole === 'superadmin') && (
        <>
          <button 
            onClick={() => setActiveTab('rentabilite')}
            className={`admin-tab-btn ${activeTab === 'rentabilite' ? 'active' : ''} admin-tab-btn-flex`}
          >
            <TrendingUpIcon active={activeTab === 'rentabilite'} />
            <span>Rentabilité</span>
          </button>
          <button 
            onClick={() => setActiveTab('historique')}
            className={`admin-tab-btn ${activeTab === 'historique' ? 'active' : ''} admin-tab-btn-flex`}
          >
            <HistoryIcon active={activeTab === 'historique'} />
            <span>Historique</span>
          </button>
        </>
      )}
    </div>
  );
};
