'use client';

import { useState } from 'react';
import styles from './calculator.module.css';
import diamondData from '../../../data/diamondSizes.json';

type Shape = keyof typeof diamondData;

export default function CalculatorPage() {
  const shapes = Object.keys(diamondData) as Shape[];
  const [activeShape, setActiveShape] = useState<Shape>('round');
  const [selectedMM, setSelectedMM] = useState<string>(diamondData['round'][0].mm);

  const currentData = diamondData[activeShape];

  // Find the exact carat match for the selected MM, or default to first if not found
  const selectedCarat = currentData.find(d => d.mm === selectedMM)?.carat || currentData[0].carat;

  const handleShapeChange = (shape: Shape) => {
    setActiveShape(shape);
    setSelectedMM(diamondData[shape][0].mm);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>MM to carat weight conversion</h1>
        <p className={styles.subtitle}>Millimeter (mm) measurements reflect the gemstone’s dimensions, while carats measure weight, and understanding those differences is important in jewelry shopping. Carat weight affects a diamond’s appearance, it doesn’t directly equate to size, as two diamonds of the same weight can look different depending on how the weight is distributed. The charts below provide estimated diamond millimeter-to-carat conversions, which may vary for other gemstones due to differences in density.</p>
      </div>

      <div className={styles.container}>
        {/* Shape Selector */}
        <div className={styles.shapeSelector}>
          {shapes.map((shape) => (
            <button
              key={shape}
              className={`${styles.shapeBtn} ${activeShape === shape ? styles.activeShapeBtn : ''}`}
              onClick={() => handleShapeChange(shape)}
            >
              {shape.toUpperCase()}
            </button>
          ))}
        </div>

        <div className={styles.contentSplit}>
          {/* Left Side: Calculator & Image */}
          <div className={styles.calculatorSide}>
            <div className={styles.calculatorBox}>
              <h2 className={styles.boxTitle}>Calculate Weight</h2>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Select MM Size:</label>
                <select
                  className={styles.selectInput}
                  value={selectedMM}
                  onChange={(e) => setSelectedMM(e.target.value)}
                >
                  {currentData.map((d, i) => (
                    <option key={i} value={d.mm}>{d.mm} mm</option>
                  ))}
                </select>
              </div>

              <div className={styles.resultBox}>
                <div className={styles.resultLabel}>Estimated Carat Weight</div>
                <div className={styles.resultValue}>{selectedCarat} ct</div>
              </div>
            </div>
          </div>

          {/* Right Side: Full Table Reference */}
          <div className={styles.tableSide}>
            <h2 className={styles.tableTitle}>{activeShape.toUpperCase()} Reference Chart</h2>
            <div className={styles.tableContainer}>
              <table className={styles.referenceTable}>
                <thead>
                  <tr>
                    <th>MM Size</th>
                    <th>Carat Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((d, i) => (
                    <tr key={i} className={selectedMM === d.mm ? styles.activeRow : ''}>
                      <td>{d.mm} mm</td>
                      <td>{d.carat} ct</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
