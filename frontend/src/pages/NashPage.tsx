import React, { useState } from "react";
import NashGenerated from "./NashGenerated";
import QuestionsList from "./QuestionsList";
import GlassCard from "../components/ui/GlassCard";

export default function NashPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGenerated = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <GlassCard>
        <NashGenerated onGenerated={handleGenerated} />
      </GlassCard>

      <GlassCard header={<h3 style={{ margin: 0 }}>Available Questions</h3>}>
        <QuestionsList filterType="all_context" contextMode="nash" refreshKey={refreshKey} />
      </GlassCard>
    </div>
  );
}
