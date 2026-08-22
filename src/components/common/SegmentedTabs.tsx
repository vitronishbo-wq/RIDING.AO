import React from 'react';

export interface SegmentedTabItem<Id extends string> {
  id: Id;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
}

interface SegmentedTabsProps<Id extends string> {
  items: readonly SegmentedTabItem<Id>[];
  value: Id;
  onChange: (value: Id) => void;
  containerClassName: string;
  buttonClassName: string;
  activeClassName: string;
  inactiveClassName: string;
  iconClassName?: string;
}

export function SegmentedTabs<Id extends string>({
  items,
  value,
  onChange,
  containerClassName,
  buttonClassName,
  activeClassName,
  inactiveClassName,
  iconClassName
}: SegmentedTabsProps<Id>): React.ReactElement {
  return (
    <div className={containerClassName}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = value === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`${buttonClassName} ${isActive ? activeClassName : inactiveClassName}`}
          >
            {Icon && <Icon className={item.iconClassName || iconClassName} />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
