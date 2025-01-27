import { useState, useEffect } from 'react'
import './App.css'
import data from './data/data.json'

function App() {
  const [gridData, setGridData] = useState([])
  const [selectedDataType, setSelectedDataType] = useState('temperature')
  const [selectedPoint, setSelectedPoint] = useState(null)
  const gridSize = 100
  const cellSize = 10

  // Define data ranges and colors for each type
  const dataRanges = {
    temperature: { min: 70, max: 210, unit: '°', label: 'Temperature' },
    humidity: { min: 10, max: 70, unit: '%', label: 'Humidity' },
    co2: { min: 10, max: 100, unit: ' ppm', label: 'CO2' }
  }

  // Define color points for each data type
  const legendPoints = {
    temperature: [
      { value: 70, label: 'Cold' },
      { value: 105, label: 'Cool' },
      { value: 140, label: 'Moderate' },
      { value: 175, label: 'Warm' },
      { value: 210, label: 'Hot' }
    ],
    humidity: [
      { value: 10, label: 'Very Dry' },
      { value: 25, label: 'Dry' },
      { value: 40, label: 'Moderate' },
      { value: 55, label: 'Humid' },
      { value: 70, label: 'Very Humid' }
    ],
    co2: [
      { value: 10, label: 'Low' },
      { value: 32.5, label: 'Moderate-Low' },
      { value: 55, label: 'Moderate' },
      { value: 77.5, label: 'Moderate-High' },
      { value: 100, label: 'High' }
    ]
  }

  // Function to handle point click
  const handlePointClick = (point, event) => {
    event.stopPropagation() // Prevent grid cell click
    setSelectedPoint(point)
  }

  // Function to close popup when clicking outside
  const handleBackgroundClick = () => {
    setSelectedPoint(null)
  }

  useEffect(() => {
    // Initialize empty grid
    const grid = Array(gridSize / cellSize).fill().map(() =>
      Array(gridSize / cellSize).fill().map(() => ({
        temperature: 0,
        humidity: 0,
        co2: 0,
        count: 0,
        hasData: false,
        originalPoints: [] // Store original data points
      }))
    )

    // First pass: Place points in grid cells
    data.forEach(point => {
      const gridX = Math.floor(point.longitude / cellSize)
      const gridY = Math.floor(point.latitude / cellSize)

      if (gridX >= 0 && gridX < gridSize / cellSize && gridY >= 0 && gridY < gridSize / cellSize) {
        grid[gridY][gridX].temperature += point.temperature
        grid[gridY][gridX].humidity += point.humidity
        grid[gridY][gridX].co2 += point.co2
        grid[gridY][gridX].count++
        grid[gridY][gridX].hasData = true
        // Store the original point data
        grid[gridY][gridX].originalPoints.push({
          ...point,
          gridX: gridX * cellSize + cellSize / 2,
          gridY: gridY * cellSize + cellSize / 2
        })
      }
    })

    // Calculate averages for cells with points
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.count > 0) {
          cell.temperature /= cell.count
          cell.humidity /= cell.count
          cell.co2 /= cell.count
        }
      })
    })

    // Second pass: Fill empty cells with nearest neighbor values so no part of map is empy
    const maxGridSize = gridSize / cellSize
    for (let y = 0; y < maxGridSize; y++) {
      for (let x = 0; x < maxGridSize; x++) {
        if (!grid[y][x].hasData) {
          let nearestDistance = Infinity
          let nearestCell = null

          for (let searchRadius = 1; searchRadius < maxGridSize && !nearestCell; searchRadius++) {
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
              for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const searchY = y + dy
                const searchX = x + dx

                if (
                  searchY >= 0 && searchY < maxGridSize &&
                  searchX >= 0 && searchX < maxGridSize &&
                  grid[searchY][searchX].hasData
                ) {
                  const distance = Math.sqrt(dx * dx + dy * dy)
                  if (distance < nearestDistance) {
                    nearestDistance = distance
                    nearestCell = grid[searchY][searchX]
                  }
                }
              }
            }
            if (nearestCell) break
          }

          if (nearestCell) {
            grid[y][x].temperature = nearestCell.temperature
            grid[y][x].humidity = nearestCell.humidity
            grid[y][x].co2 = nearestCell.co2
          }
        }
      }
    }

    setGridData(grid)
  }, [])

  // Function to get color based on value and data type
  const getColor = (value, dataType) => {
    const range = dataRanges[dataType]
    const normalized = (value - range.min) / (range.max - range.min)
    const hue = (1 - normalized) * 240 // Blue (240) to Red (0)
    return `hsl(${hue}, 70%, 50%)`
  }

  const getValue = (cell, dataType) => {
    return cell[dataType]
  }

  return (
    <div className="map-container" style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      padding: '10px',
      boxSizing: 'border-box',
      backgroundColor: 'white',
      overflow: 'hidden',
      gap: '20px'
    }} onClick={handleBackgroundClick}>
      {/* Data Type Selector */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '15px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white',
        height: 'fit-content'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Select Data Type</h3>
        {Object.entries(dataRanges).map(([type, info]) => (
          <button
            key={type}
            onClick={() => setSelectedDataType(type)}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: selectedDataType === type ? '#e0e0e0' : 'white',
              cursor: 'pointer',
              fontWeight: selectedDataType === type ? 'bold' : 'normal'
            }}
          >
            {info.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
          {dataRanges[selectedDataType].label} Map
        </h1>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          overflow: 'hidden'
        }}>
          <div className="grid" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize / cellSize}, 1fr)`,
            gap: '1px',
            backgroundColor: '#ccc',
            padding: '10px',
            aspectRatio: '1',
            width: 'min(65vh, 65vw)',
            boxSizing: 'border-box',
            border: '1px solid #ccc',
            borderRadius: '4px',
            position: 'relative'
          }}>
            {gridData.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  style={{
                    width: '100%',
                    paddingBottom: '100%',
                    backgroundColor: getColor(getValue(cell, selectedDataType), selectedDataType),
                    position: 'relative',
                    transition: 'transform 0.1s ease-in-out, background-color 0.3s ease-in-out'
                  }}
                />
              ))
            )}
            {/* Data Point Markers */}
            {gridData.flat().map((cell, index) =>
              cell.originalPoints.map((point, pointIndex) => (
                <div
                  key={`point-${index}-${pointIndex}`}
                  onClick={(e) => handlePointClick(point, e)}
                  style={{
                    position: 'absolute',
                    left: `${(point.longitude)}%`,
                    top: `${(point.latitude)}%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'white',
                    border: '2px solid black',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 2,
                    transition: 'transform 0.1s ease-in-out',
                    ':hover': {
                      transform: 'translate(-50%, -50%) scale(1.2)'
                    }
                  }}
                />
              ))
            )}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: 'white',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>{dataRanges[selectedDataType].label} Scale:</span>
              <div style={{
                width: '200px',
                height: '20px',
                background: 'linear-gradient(to right, blue, red)',
                borderRadius: '3px'
              }}/>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '10px',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              {legendPoints[selectedDataType].map(point => (
                <div key={point.value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: getColor(point.value, selectedDataType),
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '5px'
                  }}/>
                  <div>{point.label}</div>
                  <div>{point.value}{dataRanges[selectedDataType].unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Popup Box */}
      {selectedPoint && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          border: '1px solid #ccc',
          zIndex: 1000,
          minWidth: '250px'
        }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Data Point Details</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>Latitude: {selectedPoint.latitude.toFixed(2)}°</div>
            <div>Longitude: {selectedPoint.longitude.toFixed(2)}°</div>
            <div>Temperature: {selectedPoint.temperature.toFixed(1)}°</div>
            <div>Humidity: {selectedPoint.humidity.toFixed(1)}%</div>
            <div>CO2: {selectedPoint.co2.toFixed(1)} ppm</div>
          </div>
          <button
            onClick={() => setSelectedPoint(null)}
            style={{
              marginTop: '15px',
              padding: '8px 15px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: '#f0f0f0',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

export default App
