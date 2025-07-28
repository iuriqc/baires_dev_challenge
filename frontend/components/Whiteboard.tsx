'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Palette, Eraser, RotateCcw, Download, Upload } from 'lucide-react'
import { DrawingPoint, DrawingStroke } from '@/types'

interface WhiteboardProps {
  socket: WebSocket | null
}

export default function Whiteboard({ socket }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(2)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [strokes, setStrokes] = useState<DrawingStroke[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redraw all strokes
    strokes.forEach(stroke => {
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.points.length > 0) {
        ctx.beginPath()
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
        }
        
        ctx.stroke()
      }
    })
  }, [strokes])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): DrawingPoint => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const point = getMousePos(e)
    const newStroke: DrawingStroke = {
      points: [point],
      color: tool === 'eraser' ? '#ffffff' : currentColor,
      width: brushSize,
      userId: 'current-user', // This should come from user context
      timestamp: new Date(),
    }
    setStrokes(prev => [...prev, newStroke])
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const point = getMousePos(e)
    setStrokes(prev => {
      const newStrokes = [...prev]
      const currentStroke = newStrokes[newStrokes.length - 1]
      if (currentStroke) {
        currentStroke.points.push(point)
      }
      return newStrokes
    })
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    setStrokes([])
    if (socket) {
      socket.send(JSON.stringify({
        type: 'drawing_action',
        action_type: 'clear',
        data: {},
      }))
    }
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'whiteboard.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded ${tool === 'pen' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded ${tool === 'eraser' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Color:</span>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearCanvas}
            className="btn btn-outline btn-sm"
            title="Clear Canvas"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={downloadCanvas}
            className="btn btn-outline btn-sm"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            className="btn btn-outline btn-sm"
            title="Upload Image"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="canvas-container h-full"
        >
          <canvas
            ref={canvasRef}
            className="canvas w-full h-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </motion.div>
      </div>
    </div>
  )
} 