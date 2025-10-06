// Grid türleri
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
