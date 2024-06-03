import React, { useRef, useState, useEffect } from 'react';

const CanvasGrid = ({mode}) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [dotSpacing, setDotSpacing] = useState(10); // Initial spacing
  const dotRadius = 0.5;
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [nameIndex, setNameIndex] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanX, setLastPanX] = useState(0);
  const [lastPanY, setLastPanY] = useState(0);
  const snapThreshold = 10;

  const getCanvasCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (event.touches && event.touches[0]) {
      const touch = event.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    return { x, y };
  };

  const drawLine = (context, startX, startY, endX, endY, length) => {
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    context.font = `400 ${12 * scale}px Epilogue`;
    context.fillStyle = 'black';
    context.fillText(Math.round(length)+"cm", midX, midY + 15);
  };

  const drawPoint = (context, x, y, name) => {
    context.beginPath();
    context.arc(x, y, 2 * scale, 0, Math.PI * 2);
    context.fillStyle = 'black';
    context.fill();
    context.font = `400 ${12 * scale}px Epilogue`;
    context.fillStyle = 'black';
    context.fillText(name, x, y + 15); // Adjust position for name
  };

  const findNearestPoint = (x, y) => {
    const threshold = snapThreshold / scale;
    let nearestPoint = null;
    let minDistance = threshold;

    points.forEach(point => {
      const distance = Math.hypot(x - point.x, y - point.y);
      if (distance < minDistance) {
        nearestPoint = point;
        minDistance = distance;
      }
    });

    return nearestPoint;
  };

  const handleStart = (event) => {
    const { x, y } = getCanvasCoordinates(event);
    if (mode === 'pan') {
      setIsPanning(true);
      setLastPanX(x);
      setLastPanY(y);
    } else {
      setIsDrawing(true);
      const adjustedX = (x - panX) / scale;
      const adjustedY = (y - panY) / scale;

      const nearestPoint = findNearestPoint(adjustedX, adjustedY);
      if (nearestPoint) {
        setStartX(nearestPoint.x);
        setStartY(nearestPoint.y);
      } else {
        setStartX(adjustedX);
        setStartY(adjustedY);
      }

      setCurrentX(adjustedX);
      setCurrentY(adjustedY);
    }
  };

  const handleMove = (event) => {
    if (isPanning) {
      const { x, y } = getCanvasCoordinates(event);
      setPanX(panX + (x - lastPanX));
      setPanY(panY + (y - lastPanY));
      setLastPanX(x);
      setLastPanY(y);
    } else if (isDrawing) {
      const { x, y } = getCanvasCoordinates(event);
      setCurrentX((x - panX) / scale);
      setCurrentY((y - panY) / scale);
    }
    redrawCanvas();
  };

  const handleEnd = (event) => {
    if (isPanning) {
      setIsPanning(false);
    } else if (isDrawing) {
      setIsDrawing(false);
      const adjustedX = currentX;
      const adjustedY = currentY;

      const startNearestPoint = findNearestPoint(startX, startY);
      const endNearestPoint = findNearestPoint(adjustedX, adjustedY);

      const finalStartX = startNearestPoint ? startNearestPoint.x : startX;
      const finalStartY = startNearestPoint ? startNearestPoint.y : startY;
      const finalEndX = endNearestPoint ? endNearestPoint.x : adjustedX;
      const finalEndY = endNearestPoint ? endNearestPoint.y : adjustedY;

      const newLine = {
        startX: finalStartX,
        startY: finalStartY,
        endX: finalEndX,
        endY: finalEndY
      };

      const lengthInUnits = (Math.hypot(finalEndX - finalStartX, finalEndY - finalStartY) / (dotSpacing * 4)).toFixed(1);
      newLine.length = lengthInUnits;

      setLines([...lines, newLine]);

      if (!startNearestPoint) {
        const newPointNameStart = generatePointName(nameIndex);
        setPoints([...points, { x: finalStartX, y: finalStartY, name: newPointNameStart }]);
      }

      if (!endNearestPoint) {
        if (!startNearestPoint){
          const newPointNameStart = generatePointName(nameIndex);
          const newPointNameEnd = generatePointName(nameIndex+1);
          setNameIndex(nameIndex + 2);
          setPoints([...points, { x: finalStartX, y: finalStartY, name: newPointNameStart },{ x: finalEndX, y: finalEndY, name: newPointNameEnd }]);
        } else {
          const newPointNameEnd = generatePointName(nameIndex);
          setNameIndex(nameIndex + 1);
          setPoints([...points, { x: finalEndX, y: finalEndY, name: newPointNameEnd }]);
        }
      }

      redrawCanvas();
    }
  };

  const generatePointName = (index) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let name = '';
    while (index >= 0) {
      name = letters[index % 26] + name;
      index = Math.floor(index / 26) - 1;
    }
    return name;
  };

  const drawGrid = (context, width, height) => {
    context.clearRect(0, 0, width, height);
    const spacing = dotSpacing * scale;
    for (let x = -panX % spacing; x < width; x += spacing) {
      for (let y = -panY % spacing; y < height; y += spacing) {
        context.beginPath();
        context.arc(x, y, dotRadius * scale, 0, Math.PI * 2);
        context.fillStyle = 'black';
        context.fill();
      }
    }
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    redrawCanvas();
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const { x, y } = getCanvasCoordinates(event);
    const zoomFactor = 1.01;
    const mouseX = (x - panX) / scale;
    const mouseY = (y - panY) / scale;

    let newScale;
    if (event.deltaY < 0) {
      newScale = Math.min(scale * zoomFactor, 10);
    } else {
      newScale = Math.max(scale / zoomFactor, 0.1);
    }

    const newPanX = x - mouseX * newScale;
    const newPanY = y - mouseY * newScale;

    setScale(newScale);
    setPanX(newPanX);
    setPanY(newPanY);

    redrawCanvas();
  };

  const calculateAngle = (line1, line2) => {
    const angle1 = Math.atan2(line1.endY - line1.startY, line1.endX - line1.startX);
    const angle2 = Math.atan2(line2.endY - line2.startY, line2.endX - line2.startX);

    const angle = Math.abs(angle1 - angle2);
    return angle * (180 / Math.PI);
  };


  const drawAngle = (context, vertex, line1, line2) => {
    const angle = calculateAngle(line1, line2);
    const radius = 20 * scale;
    let getNormalizedAngle = (dx, dy) => {
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      return angle;
    };

    let commonPoint, restPoints;

    if (line1.startX === line2.startX && line1.startY === line2.startY ) {
      commonPoint = {
        x: line1.startX,
        y: line1.startY
      }
      restPoints = {
        1: {
          x: line1.endX,
          y: line1.endY
        },
        2: {
          x: line2.endX,
          y: line2.endY
        },
      }
    } else if (line1.startX === line2.endX && line1.startY === line2.endY ) {
      commonPoint = {
        x: line1.startX,
        y: line1.startY
      }
      restPoints = {
        1: {
          x: line1.endX,
          y: line1.endY
        },
        2: {
          x: line2.startX,
          y: line2.startY
        },
      }
    } else if (line1.endX === line2.startX && line1.endY === line2.startY ) {
      commonPoint = {
        x: line1.endX,
        y: line1.endY
      }
      restPoints = {
        1: {
          x: line1.startX,
          y: line1.startY
        },
        2: {
          x: line2.endX,
          y: line2.endY
        },
      }
    } else if (line1.endX === line2.endX && line1.endY === line2.endY ) {
      commonPoint = {
        x: line1.endX,
        y: line1.endY
      }
      restPoints = {
        1: {
          x: line1.startX,
          y: line1.startY
        },
        2: {
          x: line2.startX,
          y: line2.startY
        },
      }
    }

    const pointOne = restPoints[1];
    const pointTwo = restPoints[2];

    const dx1 = pointOne.x - commonPoint.x;
    const dy1 = pointOne.y - commonPoint.y;
    const dx2 = pointTwo.x - commonPoint.x;
    const dy2 = pointTwo.y - commonPoint.y;

    let endAngle = Math.atan2(dy1,dx1);
    let startAngle = Math.atan2(dy2,dx2);

    if (startAngle > endAngle) {
      const temp = endAngle;
      endAngle = startAngle;
      startAngle = temp;
    }


    const angleFinal = parseInt((endAngle - startAngle) * 180 / Math.PI + 360) % 360;

    // let getAngle = (line) => {
    //   const dx = line.endX - line.startX;
    //   const dy = line.endY - line.startY;

    //   let angle1 = getNormalizedAngle(dx, dy);
    //   let angle2 = getNormalizedAngle(-dx, -dy);

    //   return Math.min(angle1, angle2);
    // };

    // let startAngle = getAngle(line1);
    // let endAngle = getAngle(line2);

    // console.log("Angles:", startAngle, endAngle);

    // let counterClockwise = false;

    // if (endAngle < startAngle) {
    //   counterClockwise = true;
    // } else if (endAngle - startAngle > Math.PI) {
    //   counterClockwise = true;
    // } else {
    //   counterClockwise = false;
    // }
    // console.log({
    //   startAngle, endAngle, counterClockwise
    // })

    context.save();
    context.beginPath();
    context.moveTo(commonPoint.x * scale + panX, commonPoint.y * scale + panY);
    context.arc(commonPoint.x * scale + panX, commonPoint.y * scale + panY, radius, startAngle, endAngle);
    context.fillStyle = "red";
    context.globalAlpha = 0.25;
    context.fill();
    context.restore();
    context.fillStyle = "black";

    const midAngle = (startAngle + endAngle) / 2;
    const textX = commonPoint.x * scale + panX + radius * Math.cos(midAngle);
    const textY = commonPoint.y * scale + panY + radius * Math.sin(midAngle);
    context.fillText(angleFinal.toFixed(1) + "°", textX, textY);
    context.closePath();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    drawGrid(context, width, height);

    lines.forEach(line => {
      drawLine(context, line.startX * scale + panX, line.startY * scale + panY, line.endX * scale + panX, line.endY * scale + panY, line.length);
    });

    points.forEach(point => {
      drawPoint(context, point.x * scale + panX, point.y * scale + panY, point.name);
    });

    if (isDrawing) {
      const lengthInUnits = (Math.hypot(currentX - startX, currentY - startY) / (dotSpacing * 4)).toFixed(1);
      drawLine(context, startX * scale + panX, startY * scale + panY, currentX * scale + panX, currentY * scale + panY, lengthInUnits);
    }

    // Draw angles
    points.forEach(point => {
      const connectedLines = lines.filter(line => line.startX !== line.endX && ((line.startX === point.x && line.startY === point.y) || (line.endX === point.x && line.endY === point.y)));
      console.log(connectedLines);
      if (connectedLines.length >= 2) {
        // for (let i = 0; i < connectedLines.length - 1; i++) {
        //   for (let j = i + 1; j < connectedLines.length; j++) {
            drawAngle(context, point, connectedLines[0], connectedLines[1]);
        //   }
        // }
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const handleScroll = () => {
      redrawCanvas();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [scale, lines, points, panX, panY]);



  return (
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right-click
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
  );
};

export default CanvasGrid;
