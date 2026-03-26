// SwipeFilePage.tsx — Thin wrapper for SwipeFileView

import { Helmet } from 'react-helmet-async';
import { SwipeFileView } from "../../components/SwipeFileView";
import { useSwipeFile } from "../../hooks/useSwipeFile";

export default function SwipeFilePage() {
  const {
    items,
    deleteItem,
    clearAll,
    filteredItems,
    filters,
    setFilters,
    resetFilters,
    filterOptions,
    filteredCount,
    totalCount,
  } = useSwipeFile();

  return (
    <>
      <Helmet>
        <title>Saved Ads — Cutsheet</title>
        <meta name="description" content="Your saved winning ad creatives. Build a reference library of high-scoring ads." />
        <link rel="canonical" href="https://cutsheet.xyz/app/swipe-file" />
      </Helmet>
      <h1 className="sr-only">Saved Ads</h1>
      <SwipeFileView
        items={items}
        deleteItem={deleteItem}
        clearAll={clearAll}
        filteredItems={filteredItems}
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        filterOptions={filterOptions}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />
    </>
  );
}
