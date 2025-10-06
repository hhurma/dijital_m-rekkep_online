import {
  Tldraw,
  useEditor,
  useToasts,
  DefaultMainMenu,
  DefaultMainMenuContent,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  DefaultToolbar,
  DefaultToolbarContent,
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  useActions,
  useTools,
  useIsToolSelected,
  type TLUiOverrides,
  useValue,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { useCallback, useState, useEffect, useRef } from 'react'
import { jsPDF } from 'jspdf'
import { CustomGrid } from './components/CustomGrid'
import { ShapeList } from './components/ShapeList'
import { createContext, useContext } from 'react'
import './layer-panel.css'

// Grid türleri ve ayarları
export enum GridType {
  NONE = 'none',
  SQUARED = 'squared', // Kareli kağıt
  RULED = 'ruled' // Çizgili kağıt
}

// Grid ayarları interface
export interface GridSettings {
  gridType: GridType
  lineColor: string
  lineWidth: number
  gridSize: number
  majorLineWidth: number
}

// Grid çizme utility fonksiyonu
function drawGridOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSettings: GridSettings,
  camera: { x: number; y: number; z: number }
) {
  ctx.strokeStyle = gridSettings.lineColor

  if (gridSettings.gridType === GridType.SQUARED) {
    const gridSize = gridSettings.gridSize

    // Basit grid çizimi - viewport'u hesaba katmadan
    const startX = 0
    const startY = 0
    const endX = width
    const endY = height

    // Yatay çizgiler
    for (let y = startY; y <= endY; y += gridSize) {
      const isMajorLine = y % (gridSize * 10) === 0
      ctx.lineWidth = isMajorLine ? gridSettings.majorLineWidth : gridSettings.lineWidth
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Dikey çizgiler
    for (let x = startX; x <= endX; x += gridSize) {
      const isMajorLine = x % (gridSize * 10) === 0
      ctx.lineWidth = isMajorLine ? gridSettings.majorLineWidth : gridSettings.lineWidth
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

  } else if (gridSettings.gridType === GridType.RULED) {
    const lineSpacing = gridSettings.gridSize

    ctx.lineWidth = gridSettings.lineWidth

    // Sadece yatay çizgiler
    for (let y = 0; y <= height; y += lineSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }
}

// Layer panel komponenti
function LayerPanel({ isVisible, width, onWidthChange }: {
	isVisible: boolean;
	width: number;
	onWidthChange: (width: number) => void
}) {
	const editor = useEditor()
	const shapeIds = useValue(
		'shapeIds',
		() => editor.getSortedChildIdsForParent(editor.getCurrentPageId()),
		[editor]
	)

	const isResizingRef = useRef(false)
	const startXRef = useRef(0)
	const startWidthRef = useRef(width)
	const rafIdRef = useRef<number | null>(null)

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		isResizingRef.current = true
		startXRef.current = e.clientX
		startWidthRef.current = width

		// Sadece resize handle element'ine cursor uygula
		const handle = e.currentTarget as HTMLElement
		handle.style.cursor = 'ew-resize'

		let lastWidth = width

		const handleMouseMove = (moveEvent: MouseEvent) => {
			if (!isResizingRef.current) return
			moveEvent.preventDefault()

			// Cancel previous animation frame
			if (rafIdRef.current) {
				cancelAnimationFrame(rafIdRef.current)
			}

			// Schedule new animation frame
			rafIdRef.current = requestAnimationFrame(() => {
				const deltaX = moveEvent.clientX - startXRef.current
				const newWidth = Math.max(150, Math.min(400, startWidthRef.current + deltaX))

				// Only update if width actually changed
				if (newWidth !== lastWidth) {
					lastWidth = newWidth
					onWidthChange(newWidth)
				}
			})
		}

		const handleMouseUp = () => {
			isResizingRef.current = false
			handle.style.cursor = 'ew-resize' // Hover için bırak

			// Cancel any pending animation frame
			if (rafIdRef.current) {
				cancelAnimationFrame(rafIdRef.current)
				rafIdRef.current = null
			}

			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}

		document.addEventListener('mousemove', handleMouseMove, { passive: false })
		document.addEventListener('mouseup', handleMouseUp)
	}, [width, onWidthChange])

	if (!isVisible) return null

	return (
		<div
			className="layer-panel"
			style={{ width: `${width}px` }}
		>
			<div className="layer-panel-title">Şekiller</div>
			<ShapeList
				shapeIds={shapeIds}
				depth={0}
			/>
			{/* Resize handle */}
			<div
				className="layer-panel-resize-handle"
				onMouseDown={handleMouseDown}
				style={{
					position: 'absolute',
					right: 0,
					top: 0,
					bottom: 0,
					width: '6px',
					background: 'transparent',
					cursor: 'ew-resize',
					zIndex: 10,
					pointerEvents: 'auto'
				}}
			/>
		</div>
	)
}

// Grid context
const GridContext = createContext<{
  gridSettings: GridSettings
  setGridSettings: (settings: GridSettings) => void
}>({
  gridSettings: {
    gridType: GridType.SQUARED,
    lineColor: '#e0e0e0',
    lineWidth: 1,
    gridSize: 20,
    majorLineWidth: 2
  },
  setGridSettings: () => {},
})

// Mobil cihaz tespiti için hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth <= 768 ||
                    ('ontouchstart' in window) ||
                    (navigator.maxTouchPoints > 0)
      setIsMobile(mobile)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}

// KALDIRILDI: Katman yönetimi paneli (İstenmediği için tamamen kaldırıldı)

// Default Tldraw menüsüne eylemleri enjekte eden gizli entegrasyon
function MenuIntegration() {
  const editor = useEditor()
  const toasts = useToasts()
  // Not: Tldraw'ın ana menüsü kullanıcı arayüzü tarafından yönetilir.
  // Biz yalnızca globaller sağlayıp kısayol / context üzerinden çağıracağız.

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveSDM = useCallback(async () => {
    try {
      const snapshot = editor.getSnapshot()

      // Modern tarayıcılarda File System Access API kullan
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: `dijital-murekkep-${Date.now()}.sdm`,
            types: [{
              description: 'Dijital Mürekkep Dosyası',
              accept: { 'application/json': ['.sdm'] }
            }]
          })

          const writable = await handle.createWritable()
          await writable.write(JSON.stringify(snapshot))
          await writable.close()

          toasts.addToast({ title: 'Kaydedildi', description: 'Dosya başarıyla kaydedildi', severity: 'success' })
          setOpen(false)
          return
        } catch (error) {
          // Kullanıcı cancel ettiyse sessizce çık
          if ((error as any).name === 'AbortError') return
          console.warn('File System Access API başarısız, fallback kullanılıyor:', error)
        }
      }

      // Fallback: Prompt ile dosya adı sor ve indir
      const defaultName = `dijital-murekkep-${Date.now()}.sdm`
      const fileName = prompt('Dosya adını girin (.sdm uzantısı otomatik eklenecek):', defaultName.replace('.sdm', ''))

      if (!fileName) return // Kullanıcı cancel etti

      const finalName = fileName.endsWith('.sdm') ? fileName : `${fileName}.sdm`
      const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' })
      downloadBlob(blob, finalName)

      toasts.addToast({ title: 'Kaydedildi', description: `${finalName} indirildi`, severity: 'success' })
      setOpen(false)
    } catch (e) {
      console.error(e)
      toasts.addToast({ title: 'Hata', description: 'Kaydetme başarısız', severity: 'error' })
    }
  }, [editor, toasts])

  const handleOpenSDM = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.sdm,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const snapshot = JSON.parse(text)
        // tldraw editor: snapshot yükleme (public API değişebilir; iki yol deniyoruz)
        if (typeof (editor as any).loadSnapshot === 'function') {
          ;(editor as any).loadSnapshot(snapshot)
        } else if ((editor as any).store && typeof (editor as any).store.loadSnapshot === 'function') {
          ;(editor as any).store.loadSnapshot(snapshot)
        } else {
          console.warn('Snapshot yükleme API’si bulunamadı')
        }
        toasts.addToast({ title: 'Açıldı', description: '.sdm dosyası yüklendi', severity: 'success' })
        setOpen(false)
      } catch (e) {
        console.error(e)
        toasts.addToast({ title: 'Hata', description: 'Dosya açılamadı', severity: 'error' })
      }
    }
    input.click()
  }, [editor, toasts])

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

  const handleExportPDF = useCallback(async () => {
    try {
      const { gridSettings } = useContext(GridContext)
      const snapshot = editor.getSnapshot()
      const blob = await editor.toBlob(snapshot, { format: 'png', background: true })
      const dataUrl = await blobToDataUrl(blob)

      // Ana çizimi ve grid'i birleştir
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = img.width
        canvas.height = img.height

        // Ana çizimi çiz
        ctx.drawImage(img, 0, 0)

        // Grid çizgilerini üstüne çiz (sadece NONE değilse)
        if (gridSettings.gridType !== GridType.NONE) {
          drawGridOnCanvas(ctx, canvas.width, canvas.height, gridSettings, { x: 0, y: 0, z: 1 })
        }

        // Canvas'ı data URL'e çevir
        const finalDataUrl = canvas.toDataURL('image/png')

        const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        const imgRatio = canvas.width / canvas.height
        const pageRatio = pageWidth / pageHeight
        let w = pageWidth
        let h = pageHeight
        if (imgRatio > pageRatio) {
          w = pageWidth
          h = w / imgRatio
        } else {
          h = pageHeight
          w = h * imgRatio
        }
        const x = (pageWidth - w) / 2
        const y = (pageHeight - h) / 2
        pdf.addImage(finalDataUrl, 'PNG', x, y, w, h)
        pdf.save(`dijital-murekkep-${Date.now()}.pdf`)
        toasts.addToast({ title: 'PDF Kaydedildi', description: 'Grid ile birlikte PDF indirildi', severity: 'success' })
        setOpen(false)
      }
      img.src = dataUrl
    } catch (e) {
      console.error(e)
      toasts.addToast({ title: 'Hata', description: 'PDF dışa aktarma başarısız', severity: 'error' })
    }
  }, [editor, toasts])

  // Entegrasyon: global fonksiyonları window üzerinden sunuyoruz
  ;(window as any).__dm__menu = {
    saveSdm: handleSaveSDM,
    openSdm: handleOpenSDM,
    exportPdf: handleExportPDF,
  }

  return null
}

// [1] UI overrides: aksiyonları kaydet ve toolbar’a ekle
const uiOverrides: TLUiOverrides = {
  actions(editor, actions) {
    actions['dm-save-sdm'] = {
      id: 'dm-save-sdm',
      label: 'Kaydet (.sdm)',
      icon: 'download',
      kbd: 'Mod+S',
      readonlyOk: true,
      onSelect: () => (window as any).__dm__menu?.saveSdm?.(),
    }

    actions['dm-open-sdm'] = {
      id: 'dm-open-sdm',
      label: 'Dosya Aç (.sdm)',
      icon: 'folder',
      kbd: 'Mod+O',
      readonlyOk: true,
      onSelect: () => (window as any).__dm__menu?.openSdm?.(),
    }

    actions['dm-export-pdf'] = {
      id: 'dm-export-pdf',
      label: 'PDF Dışa Aktar',
      icon: 'file',
      readonlyOk: true,
      onSelect: () => (window as any).__dm__menu?.exportPdf?.(),
    }

    return actions
  },
}

// Default ana menüyü override ederek Dosya altına öğeler ekle
function CustomMainMenu() {
  return (
    <DefaultMainMenu>
      <TldrawUiMenuGroup id="dm-file">
        <TldrawUiMenuItem
          id="dm-save-sdm"
          label="Kaydet (.sdm)"
          icon="download"
          readonlyOk
          kbd="Mod+S"
          onSelect={() => (window as any).__dm__menu?.saveSdm?.()}
        />
        <TldrawUiMenuItem
          id="dm-open-sdm"
          label="Dosya Aç (.sdm)"
          icon="folder"
          readonlyOk
          kbd="Mod+O"
          onSelect={() => (window as any).__dm__menu?.openSdm?.()}
        />
        <TldrawUiMenuItem
          id="dm-export-pdf"
          label="PDF Olarak Dışa Aktar"
          icon="file"
          readonlyOk
          onSelect={() => (window as any).__dm__menu?.exportPdf?.()}
        />
      </TldrawUiMenuGroup>
      <DefaultMainMenuContent />
    </DefaultMainMenu>
  )
}

// Var olan toolbar'a ek butonlar (ayrı yüzen toolbar KALDIRILDI)
function CustomToolbar({ isLayerPanelVisible, setIsLayerPanelVisible, ...props }: any) {
  const actions = useActions()
  const { gridSettings, setGridSettings } = useContext(GridContext)

  return (
    <DefaultToolbar {...props}>
      {/* varolan içerik */}
      <DefaultToolbarContent />

      {/* Layer panel toggle butonu */}
      <TldrawUiMenuGroup id="dm-layer">
        <TldrawUiMenuItem
          id="dm-layer-toggle"
          label={isLayerPanelVisible ? "Layer Panel'i Gizle" : "Layer Panel'i Göster"}
          icon="layers"
          readonlyOk
          onSelect={() => setIsLayerPanelVisible(!isLayerPanelVisible)}
        />
      </TldrawUiMenuGroup>
      {/* Grid seçici butonları */}
      <TldrawUiMenuGroup id="dm-grid">
        <TldrawUiMenuItem
          id="dm-grid-none"
          label="Grid Yok"
          icon="grid"
          readonlyOk
          onSelect={() => setGridSettings({ ...gridSettings, gridType: GridType.NONE })}
        />
        <TldrawUiMenuItem
          id="dm-grid-squared"
          label="Kareli Kağıt"
          icon="grid"
          readonlyOk
          onSelect={() => setGridSettings({ ...gridSettings, gridType: GridType.SQUARED })}
        />
        <TldrawUiMenuItem
          id="dm-grid-ruled"
          label="Çizgili Kağıt"
          icon="grid"
          readonlyOk
          onSelect={() => setGridSettings({ ...gridSettings, gridType: GridType.RULED })}
        />
        <TldrawUiMenuItem
          id="dm-grid-settings"
          label="Grid Ayarları"
          icon="settings"
          readonlyOk
          onSelect={() => {
            // Grid ayarları panelini açmak için basit bir alert kullanacağız
            const gridSize = prompt('Grid boyutu (px):', gridSettings.gridSize.toString())
            const lineWidth = prompt('Çizgi kalınlığı:', gridSettings.lineWidth.toString())
            const lineColor = prompt('Çizgi rengi (hex):', gridSettings.lineColor)
            const majorLineWidth = prompt('Ana çizgi kalınlığı:', gridSettings.majorLineWidth.toString())

            if (gridSize && lineWidth && lineColor && majorLineWidth) {
              setGridSettings({
                ...gridSettings,
                gridSize: parseInt(gridSize),
                lineWidth: parseFloat(lineWidth),
                lineColor,
                majorLineWidth: parseFloat(majorLineWidth)
              })
            }
          }}
        />
      </TldrawUiMenuGroup>
      {/* sona custom aksiyonları ekle */}
      {actions['dm-save-sdm'] && (
        <TldrawUiMenuItem {...(actions as any)['dm-save-sdm']} />
      )}
      {actions['dm-open-sdm'] && (
        <TldrawUiMenuItem {...(actions as any)['dm-open-sdm']} />
      )}
      {actions['dm-export-pdf'] && (
        <TldrawUiMenuItem {...(actions as any)['dm-export-pdf']} />
      )}
    </DefaultToolbar>
  )
}

// Ek: Sağ üst ekstra yüzen export barı kaldırıldı
/*
function LegacyFloatingExportBar() {
  const editor = useEditor()
  const toasts = useToasts()
  const [isExporting, setIsExporting] = useState(false)
  const isMobile = useIsMobile()

  // Dosya işlemleri (global fonksiyonları kullan)
  const handleSaveSDM = useCallback(async () => {
    if ((window as any).__dm__menu?.saveSdm) {
      await (window as any).__dm__menu.saveSdm()
    }
  }, [])

  const handleOpenSDM = useCallback(async () => {
    if ((window as any).__dm__menu?.openSdm) {
      await (window as any).__dm__menu.openSdm()
    }
  }, [])

  const handleExportPDF = useCallback(async () => {
    if ((window as any).__dm__menu?.exportPdf) {
      await (window as any).__dm__menu.exportPdf()
    }
  }, [])

  // Dışa aktarma işlemleri
  const handleExportPNG = useCallback(async () => {
    setIsExporting(true)
    try {
      const snapshot = editor.getSnapshot()
      const blob = await editor.toBlob(snapshot, { format: 'png', background: true })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dijital-murekkep-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
      toasts.addToast({
        title: 'PNG Dışa Aktarıldı',
        description: 'Çiziminiz PNG olarak kaydedildi',
        severity: 'success'
      })
    } catch (error) {
      console.error('PNG export error:', error)
      toasts.addToast({
        title: 'Hata',
        description: 'PNG dışa aktarma başarısız oldu',
        severity: 'error'
      })
    } finally {
      setIsExporting(false)
    }
  }, [editor, toasts])

  const handleExportSVG = useCallback(async () => {
    setIsExporting(true)
    try {
      const { gridSettings } = useContext(GridContext)
      const snapshot = editor.getSnapshot()
      const svgString = await editor.toSvgString(snapshot, { background: true })

      let finalSvgString = svgString

      // Grid'i SVG'ye ekle (sadece NONE değilse)
      if (gridSettings.gridType !== GridType.NONE) {
        // SVG boyutlarını parse et
        const svgMatch = svgString.match(/<svg[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*>/)
        if (svgMatch) {
          const width = parseFloat(svgMatch[1])
          const height = parseFloat(svgMatch[2])

          // Grid çizgilerini SVG olarak oluştur
          let gridSvg = ''

          if (gridSettings.gridType === GridType.SQUARED) {
            const gridSize = gridSettings.gridSize

            // Yatay çizgiler
            for (let y = 0; y <= height; y += gridSize) {
              const isMajorLine = y % (gridSize * 10) === 0
              const strokeWidth = isMajorLine ? gridSettings.majorLineWidth : gridSettings.lineWidth
              gridSvg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${gridSettings.lineColor}" stroke-width="${strokeWidth}"/>`
            }

            // Dikey çizgiler
            for (let x = 0; x <= width; x += gridSize) {
              const isMajorLine = x % (gridSize * 10) === 0
              const strokeWidth = isMajorLine ? gridSettings.majorLineWidth : gridSettings.lineWidth
              gridSvg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${gridSettings.lineColor}" stroke-width="${strokeWidth}"/>`
            }

          } else if (gridSettings.gridType === GridType.RULED) {
            const lineSpacing = gridSettings.gridSize

            // Sadece yatay çizgiler
            for (let y = 0; y <= height; y += lineSpacing) {
              gridSvg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${gridSettings.lineColor}" stroke-width="${gridSettings.lineWidth}"/>`
            }
          }

          // Grid çizgilerini SVG'nin içine ekle (</svg>'den önce)
          finalSvgString = svgString.replace('</svg>', gridSvg + '</svg>')
        }
      }

      const blob = new Blob([finalSvgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dijital-murekkep-${Date.now()}.svg`
      a.click()
      URL.revokeObjectURL(url)
      toasts.addToast({
        title: 'SVG Dışa Aktarıldı',
        description: 'Grid ile birlikte SVG olarak kaydedildi',
        severity: 'success'
      })
    } catch (error) {
      console.error('SVG export error:', error)
      toasts.addToast({
        title: 'Hata',
        description: 'SVG dışa aktarma başarısız oldu',
        severity: 'error'
      })
    } finally {
      setIsExporting(false)
    }
  }, [editor, toasts])

  return (
    <div style={{
      position: 'absolute',
      ...(isMobile
        ? {
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px'
          }
        : {
            top: '10px',
            right: '10px'
          }
      ),
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: isMobile ? '12px' : '8px',
      padding: isMobile ? '12px' : '8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      gap: isMobile ? '8px' : '4px',
      flexWrap: 'wrap',
      justifyContent: isMobile ? 'center' : 'flex-start'
    }}>
      <button
        onClick={handleSaveSDM}
        style={{
          padding: isMobile ? '12px 16px' : '6px 12px',
          border: '1px solid #ddd',
          borderRadius: isMobile ? '8px' : '4px',
          background: '#fff',
          cursor: 'pointer',
          fontSize: isMobile ? '14px' : '12px',
          fontWeight: '500',
          minWidth: isMobile ? '60px' : 'auto',
          minHeight: isMobile ? '44px' : 'auto',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
        title="Kaydet (.sdm)"
      >
        {isMobile ? '💾' : '💾 SDM'}
      </button>

      <button
        onClick={handleOpenSDM}
        style={{
          padding: isMobile ? '12px 16px' : '6px 12px',
          border: '1px solid #ddd',
          borderRadius: isMobile ? '8px' : '4px',
          background: '#fff',
          cursor: 'pointer',
          fontSize: isMobile ? '14px' : '12px',
          fontWeight: '500',
          minWidth: isMobile ? '60px' : 'auto',
          minHeight: isMobile ? '44px' : 'auto',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
        title="Dosya Aç (.sdm)"
      >
        {isMobile ? '📁' : '📁 Aç'}
      </button>

      <button
        onClick={handleExportPDF}
        style={{
          padding: isMobile ? '12px 16px' : '6px 12px',
          border: '1px solid #ddd',
          borderRadius: isMobile ? '8px' : '4px',
          background: '#fff',
          cursor: 'pointer',
          fontSize: isMobile ? '14px' : '12px',
          fontWeight: '500',
          minWidth: isMobile ? '60px' : 'auto',
          minHeight: isMobile ? '44px' : 'auto',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
        title="PDF Olarak Dışa Aktar"
      >
        {isMobile ? '📄' : '📄 PDF'}
      </button>
      <button
        onClick={handleExportPNG}
        disabled={isExporting}
        style={{
          padding: isMobile ? '12px 16px' : '6px 12px',
          border: '1px solid #ddd',
          borderRadius: isMobile ? '8px' : '4px',
          background: '#fff',
          cursor: 'pointer',
          fontSize: isMobile ? '14px' : '12px',
          fontWeight: '500',
          minWidth: isMobile ? '60px' : 'auto',
          minHeight: isMobile ? '44px' : 'auto',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
        title="PNG olarak kaydet"
      >
        {isExporting ? '⏳' : (isMobile ? '🖼️' : 'PNG')}
      </button>

      <button
        onClick={handleExportSVG}
        disabled={isExporting}
        style={{
          padding: isMobile ? '12px 16px' : '6px 12px',
          border: '1px solid #ddd',
          borderRadius: isMobile ? '8px' : '4px',
          background: '#fff',
          cursor: 'pointer',
          fontSize: isMobile ? '14px' : '12px',
          fontWeight: '500',
          minWidth: isMobile ? '60px' : 'auto',
          minHeight: isMobile ? '44px' : 'auto',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
        title="SVG olarak kaydet"
      >
        {isExporting ? '⏳' : (isMobile ? '📄' : 'SVG')}
      </button>
    </div>
  )
}
*/

// Grid component wrapper
function GridWrapper(props: any) {
  const { gridSettings } = useContext(GridContext)
  return <CustomGrid {...props} gridSettings={gridSettings} />
}

function App() {
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    gridType: GridType.SQUARED,
    lineColor: '#e0e0e0',
    lineWidth: 1,
    gridSize: 20,
    majorLineWidth: 2
  })

  const [isLayerPanelVisible, setIsLayerPanelVisible] = useState(true)
  const [layerPanelWidth, setLayerPanelWidth] = useState(200)

  return (
    <GridContext.Provider value={{ gridSettings, setGridSettings }}>
      <div style={{ position: 'fixed', inset: 0 }}>
        <div style={{ height: '100vh', position: 'relative' }}>
        <Tldraw
          locale="en"
          overrides={uiOverrides}
          components={{
            MainMenu: CustomMainMenu,
            Toolbar: (props: any) => <CustomToolbar {...props} isLayerPanelVisible={isLayerPanelVisible} setIsLayerPanelVisible={setIsLayerPanelVisible} />,
            Grid: GridWrapper,
            InFrontOfTheCanvas: () => <LayerPanel isVisible={isLayerPanelVisible} width={layerPanelWidth} onWidthChange={setLayerPanelWidth} />
          }}
          getShapeVisibility={(s) =>
            s.meta.force_show ? 'visible' : s.meta.hidden ? 'hidden' : 'inherit'
          }
          onMount={(editor) => {
            editor.updateInstanceState({ isGridMode: true })
          }}
        >
            <MenuIntegration />
          </Tldraw>
        </div>
      </div>
    </GridContext.Provider>
  )
}

export default App
