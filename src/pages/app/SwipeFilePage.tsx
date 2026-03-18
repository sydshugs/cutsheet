// SwipeFilePage.tsx — Thin wrapper for SwipeFileView

import { Helmet } from 'react-helmet-async';
import { SwipeFileView } from "../../components/SwipeFileView";

export default function SwipeFilePage() {
  return (
    <>
      <Helmet>
        <title>Swipe File — Cutsheet</title>
        <meta name="description" content="Your saved winning ad creatives. Build a reference library of high-scoring ads." />
        <link rel="canonical" href="https://cutsheet.xyz/app/swipe-file" />
      </Helmet>
      <SwipeFileView isDark={true} />
    </>
  );
}
