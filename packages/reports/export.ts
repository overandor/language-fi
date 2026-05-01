export function toCSV(rows: any[]): string {
  if (!rows.length) return ""
  
  const headers = Object.keys(rows[0])
  const headerRow = headers.join(",")
  const dataRows = rows.map(row => 
    headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ""
      if (typeof value === "string") return `"${value}"`
      return String(value)
    }).join(",")
  )
  
  return [headerRow, ...dataRows].join("\n")
}

export function toJSON(rows: any[]): string {
  return JSON.stringify(rows, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
