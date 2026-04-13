"use client";

import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { Gallery } from "@/components/Gallery";
import { useGalleryStore } from "@/hooks/useGalleryStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function Home() {
  const store = useGalleryStore();

  useKeyboardShortcuts({
    selectedIds: store.selectedIds,
    sites: store.filteredSites,
    onToggleStar: store.toggleStar,
    onClearSelection: store.clearSelection,
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <Header
        search={store.filter.search}
        onSearchChange={(search) => store.updateFilter({ search })}
        layout={store.layout}
        onLayoutChange={store.setLayout}
        columns={store.columns}
        onColumnsChange={store.setColumns}
        totalCount={store.sites.length}
        filteredCount={store.filteredSites.length}
      />

      {/* フィルターバー（ソースタブ + お気に入り + エージェンシー + 日付） */}
      <FilterBar
        filter={store.filter}
        updateFilter={store.updateFilter}
        toggleSource={store.toggleSource}
        onClearSources={() => store.updateFilter({ sources: [] })}
        resetFilter={store.resetFilter}
      />

      {/* ギャラリー */}
      <Gallery
        sites={store.filteredSites}
        layout={store.layout}
        columns={store.columns}
        selectedIds={store.selectedIds}
        onSelect={store.handleSelect}
        onToggleStar={store.toggleStar}
        onClearSelection={store.clearSelection}
        onColumnsChange={store.setColumns}
        onSetSelection={store.setSelection}
      />
    </div>
  );
}
