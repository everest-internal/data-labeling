import { useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Document, Page } from 'react-pdf'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'

const PREDEFINED_FIELDS = [
  { key: 'invoice_number', label: 'Invoice Number' },
  { key: 'invoice_date', label: 'Invoice Date' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'total', label: 'Total Amount' },
]

export default function App() {
  const [file, setFile] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [labels, setLabels] = useState(() => {
    const initial = {}
    PREDEFINED_FIELDS.forEach(f => (initial[f.key] = ''))
    return initial
  })
  const [customFields, setCustomFields] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef()

  const allFields = useMemo(() => {
    return [
      ...PREDEFINED_FIELDS.map(f => ({ ...f, type: 'predefined' })),
      ...customFields.map(f => ({ key: f.key, label: f.label, type: 'custom' })),
    ]
  }, [customFields])

  function onFileChange(e) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setResult(null)
    }
  }

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
  }

  function updateLabel(key, value) {
    setLabels(prev => ({ ...prev, [key]: value }))
  }

  function addCustomField() {
    const key = prompt('Enter field key (e.g., po_number):')
    if (!key) return
    const label = prompt('Enter field label (e.g., PO Number):') || key
    if (labels[key] !== undefined) {
      alert('Key already exists')
      return
    }
    setCustomFields(prev => [...prev, { key, label }])
    setLabels(prev => ({ ...prev, [key]: '' }))
  }

  function removeCustomField(key) {
    setCustomFields(prev => prev.filter(f => f.key !== key))
    setLabels(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      alert('Please choose a PDF first')
      return
    }
    setIsSubmitting(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('labelsJson', JSON.stringify(labels))

      const res = await axios.post(`${SERVER_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', gap: 16, padding: 16 }}>
      <div style={{ width: 360, overflow: 'auto', borderRight: '1px solid #ddd', paddingRight: 16 }}>
        <h2>Upload and Label PDF</h2>
        <input type="file" accept="application/pdf" onChange={onFileChange} ref={fileInputRef} />

        <h3 style={{ marginTop: 16 }}>Fields</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allFields.map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 12, color: '#555' }}>{f.label}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={labels[f.key] ?? ''}
                  onChange={e => updateLabel(f.key, e.target.value)}
                  placeholder={`Enter ${f.label}`}
                  style={{ flex: 1, padding: 8 }}
                />
                {f.type === 'custom' && (
                  <button type="button" onClick={() => removeCustomField(f.key)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={addCustomField}>+ Add custom field</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Send to Drive'}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 16, fontSize: 12 }}>
            <div><strong>PDF:</strong> {result.pdf?.name} ({result.pdf?.id})</div>
            <div><strong>Labels:</strong> {result.labels?.name} ({result.labels?.id})</div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {file ? (
          <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} width={800} renderTextLayer={false} renderAnnotationLayer={false} />
            ))}
          </Document>
        ) : (
          <div style={{ color: '#888' }}>Choose a PDF to preview</div>
        )}
      </div>
    </div>
  )
}
