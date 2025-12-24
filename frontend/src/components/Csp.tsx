import React, { useState } from "react";
type Props = {
  solution: any;
  steps: string[];
};

export default function Csp({ solution, steps }: Props) {
  return (
    <div>
      <h3>Soluție finală</h3>
      <pre>{JSON.stringify(solution, null, 2)}</pre>

      <h3>Pașii algoritmului</h3>
      <ul>
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
