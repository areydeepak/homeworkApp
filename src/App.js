import React from 'react'
import Footer from './component/footer'
import CanvasGrid from './component/gridArea'
import "./css/app.css"
import { useState, useEffect } from 'react';


export default function App() {
    const [mode, setMode] = useState('pan');
    
    return (
        <div className="App">
        <div className="canvas-container">
          <CanvasGrid mode={mode} />
        </div>
          <Footer mode={mode} setMode={setMode}/>
      </div>
    )
}
