import React from 'react';
import styles from './ProductTabs.module.css';

interface ProductTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isVariable: boolean;
}

export default function ProductTabs({ activeTab, setActiveTab, isVariable }: ProductTabsProps) {
  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'inventory', label: 'Inventory & Shipping' },
    { id: 'attributes', label: 'Attributes' },
    { id: 'variations', label: 'Variations', hide: !isVariable },
    { id: 'images', label: 'Images' },
  ];

  return (
    <div className={styles.tabContainer}>
      {tabs.filter(t => !t.hide).map(tab => (
        <button
          key={tab.id}
          className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
