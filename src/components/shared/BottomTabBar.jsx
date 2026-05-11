/**
 * BottomTabBar — mobile-optimised tab bar with safe-area inset support.
 * Usage: <BottomTabBar tabs={NAV} activeTab={tab} onTabChange={setTab} badge={{bookings: 2}} />
 */
export default function BottomTabBar({ tabs, activeTab, onTabChange, badge = {} }) {
  return (
    <nav
      className="bg-card border-t border-border sticky bottom-0 z-30 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-3xl mx-auto flex">
        {tabs.map(({ key, label, icon: Icon }) => {
          const count = badge[key] || 0;
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
              <span className="leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}