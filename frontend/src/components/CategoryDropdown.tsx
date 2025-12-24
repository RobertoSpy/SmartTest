import React from "react";

/**
 * Simple dropdown that calls onSelect with 'all' or 'nash_pur'.
 */
export default function CategoryDropdown({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (cat: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  function handleSelect(cat: string) {
    setOpen(false);
    onSelect(cat);
  }

  return (
    <div style={{ position: "relative" }}>
      <button className="btn" onClick={() => setOpen(o => !o)}>
        Category: {current === "all" ? "Toate" : (current === "nash_pur" ? "Nash pur" : "Search")}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          minWidth: 180,
          border: "1px solid var(--border)",
          background: "var(--card)",
          borderRadius: 8,
          padding: 8,
          boxShadow: "var(--shadow)",
          zIndex: 50
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn" onClick={() => handleSelect("all")}>Toate</button>
            <button className="btn" onClick={() => handleSelect("nash_pur")}>Nash pur</button>
            <button className="btn" onClick={() => handleSelect("search")}>Search Problems</button>
            <button className="btn" onClick={() => handleSelect("csp")}>Csp</button>
          </div>
        </div>
      )}
    </div>
  );
}