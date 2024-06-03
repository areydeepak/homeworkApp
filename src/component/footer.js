import React from 'react'

export default function Footer({mode,setMode}) {
  
  const x1 = 10;
  const y1 = 10;
  const x2 = 50;
  const y2 = 10;
  const toggleMode = () => {
    setMode(mode === 'draw' ? 'pan' : 'draw');
  };
  return (
    <div className="footer">
    <svg width="100" height="20" onClick={toggleMode}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth="1" />
      <circle cx={x1} cy={y1} r="2" fill="black" />
      <circle cx={x2} cy={y2} r="2" fill="black" />
    </svg>
    </div>
  )
}


    