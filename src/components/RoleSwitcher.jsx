import { User, Wrench, Shield, ChevronDown } from 'lucide-react';

const roles = [
  { key: 'customer', label: 'Customer', icon: User, color: 'bg-blue-500' },
  { key: 'provider', label: 'Provider', icon: Wrench, color: 'bg-green-600' },
  { key: 'admin', label: 'Admin', icon: Shield, color: 'bg-purple-600' },
];

export default function RoleSwitcher({ currentRole, onRoleChange }) {
  const current = roles.find(r => r.key === currentRole) || roles[0];

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-1.5 flex gap-1">
        <span className="text-xs text-muted-foreground px-2 py-1.5 font-medium self-center whitespace-nowrap">Acting as:</span>
        {roles.map(role => {
          const Icon = role.icon;
          const isActive = currentRole === role.key;
          return (
            <button
              key={role.key}
              onClick={() => onRoleChange(role.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? `${role.color} text-white shadow-sm`
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon size={12} />
              {role.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}