'use client';

import { cn } from '@/lib/utils';
import { ToolTab } from '@/data/presets';
import React from "react";

interface ToolPanelProps {
  activeTab: ToolTab | null;
  onTabChange: (tab: ToolTab | null) => void;
  children: React.ReactNode;
}

const tabs: { id: ToolTab; label: string; labelEn: string; icon: string }[] = [
  { id: 'adjust', label: '调整', labelEn: 'Adjust', icon: '✏️' },
  { id: 'watermark', label: '水印', labelEn: 'Watermark', icon: '💧' },
  { id: 'merge', label: '合并', labelEn: 'Merge', icon: '🖼️' },
];

interface ToolPanelItemProps {
  icon: string;
  label: string;
  labelEn: string;
  active: boolean;
  onClick: () => void;
}

function ToolPanelItem({ icon, label, active, onClick }: ToolPanelItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
        active
          ? 'bg-primary text-primary-foreground shadow-md scale-105 ring-2 ring-primary/50'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-102'
      )}
    >
      <span className={cn('text-lg transition-transform', active && 'scale-110')}>{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export function ToolPanel({ activeTab, onTabChange, children }: ToolPanelProps) {
  const handleTabClick = (tabId: ToolTab) => {
    // 如果点击当前已选中的tab，则取消选中
    if (activeTab === tabId) {
      onTabChange(null as unknown as ToolTab);
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="flex flex-wrap gap-1 p-2 border-b border-border">
        {tabs.map(tab => (
          <ToolPanelItem
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            labelEn={tab.labelEn}
            active={activeTab === tab.id}
            onClick={() => handleTabClick(tab.id)}
          />
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {children}
      </div>
    </div>
  );
}

export { tabs };
