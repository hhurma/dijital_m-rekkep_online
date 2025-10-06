import { useLayoutEffect, useRef } from 'react'
import { useEditor, useIsDarkMode, useValue } from 'tldraw'
import { GridType } from '../App'
import type { GridSettings } from '../App'

interface GridProps {
  x: number
  y: number
  z: number
  size: number
}

interface CustomGridProps extends GridProps {
  gridSettings: GridSettings
}

export function CustomGrid({ size, ...camera }: CustomGridProps & { gridSettings: GridSettings }) {
  const editor = useEditor()

  const screenBounds = useValue('screenBounds', () => editor.getViewportScreenBounds(), [])
  const devicePixelRatio = useValue('dpr', () => editor.getInstanceState().devicePixelRatio, [])
  const isDarkMode = useIsDarkMode()

  const canvas = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    if (!canvas.current) return

    const canvasW = screenBounds.w * devicePixelRatio
    const canvasH = screenBounds.h * devicePixelRatio
    canvas.current.width = canvasW
    canvas.current.height = canvasH

    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasW, canvasH)

    // Grid type kontrolü
    if (camera.gridSettings.gridType === GridType.NONE) return

    const pageViewportBounds = editor.getViewportPageBounds()

    if (camera.gridSettings.gridType === GridType.SQUARED) {
      // Kareli kağıt için grid size
      const gridSize = camera.gridSettings.gridSize

      const startPageX = Math.ceil(pageViewportBounds.minX / gridSize) * gridSize
      const startPageY = Math.ceil(pageViewportBounds.minY / gridSize) * gridSize
      const endPageX = Math.floor(pageViewportBounds.maxX / gridSize) * gridSize
      const endPageY = Math.floor(pageViewportBounds.maxY / gridSize) * gridSize

      const numRows = Math.round((endPageY - startPageY) / gridSize)
      const numCols = Math.round((endPageX - startPageX) / gridSize)

      ctx.strokeStyle = camera.gridSettings.lineColor

      // Yatay çizgiler
      for (let row = 0; row <= numRows; row++) {
        const pageY = startPageY + row * gridSize
        const canvasY = (pageY + camera.y) * camera.z * devicePixelRatio
        const isMajorLine = pageY % (gridSize * 10) === 0
        drawLine(ctx, 0, canvasY, canvasW, canvasY, isMajorLine ? camera.gridSettings.majorLineWidth : camera.gridSettings.lineWidth)
      }

      // Dikey çizgiler
      for (let col = 0; col <= numCols; col++) {
        const pageX = startPageX + col * gridSize
        const canvasX = (pageX + camera.x) * camera.z * devicePixelRatio
        const isMajorLine = pageX % (gridSize * 10) === 0
        drawLine(ctx, canvasX, 0, canvasX, canvasH, isMajorLine ? camera.gridSettings.majorLineWidth : camera.gridSettings.lineWidth)
      }

    } else if (camera.gridSettings.gridType === GridType.RULED) {
      // Çizgili kağıt için line spacing
      const lineSpacing = camera.gridSettings.gridSize

      const startPageY = Math.ceil(pageViewportBounds.minY / lineSpacing) * lineSpacing
      const endPageY = Math.floor(pageViewportBounds.maxY / lineSpacing) * lineSpacing
      const numRows = Math.round((endPageY - startPageY) / lineSpacing)

      ctx.strokeStyle = camera.gridSettings.lineColor

      // Sadece yatay çizgiler
      for (let row = 0; row <= numRows; row++) {
        const pageY = startPageY + row * lineSpacing
        const canvasY = (pageY + camera.y) * camera.z * devicePixelRatio
        drawLine(ctx, 0, canvasY, canvasW, canvasY, camera.gridSettings.lineWidth)
      }
    }

  }, [screenBounds, camera, size, devicePixelRatio, editor, isDarkMode])

  return <canvas className="tl-grid" ref={canvas} />
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number
) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineWidth = width
  ctx.stroke()
}
