import React, { useState } from "react";
import { solveCSP } from "../api"; // Importă funcția care face apelul API

export default function CSPPoint3() {
  const [result, setResult] = useState<any>(null);

  // Variabile de stare
  const [numVariables, setNumVariables] = useState<number>(3); // Numarul de variabile
  const [variables, setVariables] = useState<string[]>(["X1", "X2", "X3"]);
  const [domains, setDomains] = useState<any>({}); // Domeniile pentru variabile
  const [partialAssignment, setPartialAssignment] = useState<any>({}); // Alocări parțiale
  const [constraints, setConstraints] = useState<any[]>([]); // Constrângeri personalizate

  // Actualizează numărul de variabile
  const handleNumVariablesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(1, parseInt(e.target.value));
    setNumVariables(count);

    // Generăm un nou set de variabile pe baza numărului introdus
    const newVariables = Array.from({ length: count }, (_, i) => `X${i + 1}`);
    setVariables(newVariables);

    // Setăm domeniile pentru fiecare variabilă
    const newDomains = newVariables.reduce((acc: any, varName: string) => {
      acc[varName] = [1, 2, 3]; // Domenii implicite
      return acc;
    }, {});
    setDomains(newDomains);

    // Actualizăm partialAssignment pentru noile variabile
    const newPartialAssignment = newVariables.reduce((acc: any, varName: string) => {
      acc[varName] = null;
      return acc;
    }, {});
    setPartialAssignment(newPartialAssignment);
  };

  // Adaugă constrângere
  const addConstraint = (var1: string, var2: string, condition: string) => {
    setConstraints((prevConstraints) => [
      ...prevConstraints,
      { var1, var2, condition }
    ]);
  };

  // Șterge un element din domeniu
  const removeFromDomain = (variable: string, value: number) => {
    const newDomains = { ...domains };
    newDomains[variable] = newDomains[variable].filter((val: number) => val !== value);
    setDomains(newDomains);
  };

  // Șterge o constrângere
  const removeConstraint = (index: number) => {
    const newConstraints = constraints.filter((_, i) => i !== index);
    setConstraints(newConstraints);
  };

  // Funcție pentru a rezolva CSP-ul
  const solve = async () => {
    // Filtrăm partial_assignment pentru a păstra doar variabilele care au o valoare nenulă
    const filteredPartialAssignment = Object.fromEntries(
      Object.entries(partialAssignment).filter(([key, value]) => value !== null)
    );
  
    const payload = {
      variables,
      domains,
      partial_assignment: filteredPartialAssignment, // trimitem doar valorile nenule
      constraints
    };
  
    console.log("Payload trimis către backend:", payload);
  
    try {
      const res = await solveCSP(payload); // Trimite cererea către backend
      setResult(res); // Setează rezultatul primit
    } catch (error) {
      console.error("Error while solving CSP:", error);
      alert("Eroare la rezolvarea problemei.");
    }
  };
  
  return (
    <div style={{ padding: 20 }}>
      <h2>Rezolvă Problema CSP</h2>

      <div>
        <h3>Număr variabile</h3>
        <input
          type="number"
          min="1"
          value={numVariables}
          onChange={handleNumVariablesChange}
          style={{ width: 60 }}
        />
        <p>Alege numărul de variabile (minim 1).</p>

        <h3>Variabile</h3>
        <ul>
          {variables.map((variable, index) => (
            <li key={variable}>
              {/* Textul pentru domeniu */}
              <label style={{ display: "block", marginBottom: "5px" }}>
                Introduceți domeniul pentru {variable}
              </label>
              <input
                type="text"
                value={domains[variable]?.join(", ")}
                onChange={(e) => {
                  const newDomains = { ...domains };
                  newDomains[variable] = e.target.value
                    .split(",")
                    .map((v) => {
                      const num = Number(v.trim());
                      return isNaN(num) ? null : num;
                    })
                    .filter((v) => v !== null);
                  setDomains(newDomains);
                }}
                style={{ marginBottom: "20px" }} // Mai mult spațiu pentru domeniu
              />

              {/* Textul pentru alocarea parțială */}
              <label style={{ display: "block", marginBottom: "5px" }}>
                Alocare parțială pentru {variable}
              </label>
              <input
                type="number"
                value={partialAssignment[variable] === null ? "" : partialAssignment[variable]} 
                onChange={(e) => {
                  const newAssignment = { ...partialAssignment };
                  newAssignment[variable] = e.target.value ? Number(e.target.value) : null;
                  setPartialAssignment(newAssignment);
                }}
                style={{ marginBottom: "20px" }} // Mai mult spațiu între elemente
              />

              {/* Butonul de ștergere a unui element din domeniu */}
              <div style={{ marginBottom: "20px" }}>
                <h4>Șterge valoare din domeniu</h4>
                {domains[variable]?.map((value: number) => (
                  <button
                    key={value}
                    onClick={() => removeFromDomain(variable, value)}
                    style={{ marginRight: "10px", marginBottom: "10px" }}
                  >
                    Șterge {value}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <h3>Constrângeri</h3>
        <div>
          <input
            type="text"
            placeholder="Ex: X1"
            id="var1"
            style={{ marginRight: "10px" }}
          />
          <input
            type="text"
            placeholder="Ex: X2"
            id="var2"
            style={{ marginRight: "10px" }}
          />
          <select id="condition" style={{ marginRight: "10px" }}>
            <option value="!=">≠</option>
            <option value="=">=</option>
            <option value=">">{">"}</option>
            <option value="<">{`<`}</option>
          </select>
          <button
            onClick={() => {
              const var1 = (document.getElementById("var1") as HTMLInputElement).value;
              const var2 = (document.getElementById("var2") as HTMLInputElement).value;
              const condition = (document.getElementById("condition") as HTMLSelectElement).value;
              addConstraint(var1, var2, condition);
            }}
            style={{ marginBottom: "20px" }}
          >
            Adaugă Constrângere
          </button>
        </div>

        {/* Listă constrângeri și buton de ștergere */}
        <div>
          <h4>Constrângeri Introduse</h4>
          <ul>
            {constraints.map((constraint, index) => (
              <li key={index}>
                {constraint.var1} {constraint.condition} {constraint.var2}
                <button onClick={() => removeConstraint(index)}>Șterge</button>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={solve} style={{ marginTop: "20px" }}>
          Rezolvă problema
        </button>
      </div>

      {result && (
        <div>
          <h3>Soluția finală</h3>
          <pre>{JSON.stringify(result.solution, null, 2)}</pre>

          <h3>Pașii algoritmului</h3>
          <ul>
            {result.steps.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
