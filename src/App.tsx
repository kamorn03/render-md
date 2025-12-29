import { useMemo, useState, type CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import './App.css'

function normalizeMarkdown(source: string) {
  return source
    .replace(/\uFEFF|\u200B/g, '') // Remove BOM and zero-width spaces
    .replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '') // Remove horizontal rules (---, ***, ___) strictly
    .replace(/\n(\*\*ตอนที่)/g, '\n\n$1') // Fix TOC line breaks
}

function splitIntoPages(source: string) {
  // Split by page-break div, robust regex for various spacings
  const parts = source.split(/<div\s+[^>]*style=['"][^'"]*page-break-after:\s*always[^'"]*['"][^>]*><\/div>/gi)
  
  return parts
    .map((page) => page.trim())
    .filter((page) => {
      // Strict filter: Remove all whitespace and common HTML entities
      const stripped = page.replace(/\s+/g, '').replace(/&nbsp;/g, '')
      return stripped.length > 0
    })
}

function App() {
  const [markdown, setMarkdown] = useState<string>('')
  const [fontSizePx, setFontSizePx] = useState<number>(18)
  const [lineHeight, setLineHeight] = useState<number>(1.75)
  const [pagePaddingMm, setPagePaddingMm] = useState<number>(20) // Default standard margin
  const [pageTopPaddingMm, setPageTopPaddingMm] = useState<number>(20)

  const pages = useMemo(() => {
    const normalized = normalizeMarkdown(markdown)
    return splitIntoPages(normalized)
  }, [markdown])

  const cssVars = useMemo(
    () =>
      ({
        ['--font-size' as string]: `${fontSizePx}px`,
        ['--line-height' as string]: `${lineHeight}`,
        ['--page-padding' as string]: `${pagePaddingMm}mm`,
        ['--page-top-padding' as string]: `${pageTopPaddingMm}mm`,
      }) as CSSProperties,
    [fontSizePx, lineHeight, pagePaddingMm, pageTopPaddingMm],
  )

  function onPickFile(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setMarkdown(text)
    }
    reader.readAsText(file)
  }

  return (
    <div className="app" style={cssVars}>
      {/* Dynamic Print Styles to handle @page margins correctly on every page */}
      <style>{`
        @media print {
          @page {
            margin-top: ${pageTopPaddingMm}mm !important;
            margin-bottom: ${pagePaddingMm}mm !important;
            margin-left: ${pagePaddingMm}mm !important;
            margin-right: ${pagePaddingMm}mm !important;
            size: A4;
          }
          .app {
             --page-top-padding: 0mm; /* Reset internal padding for print since @page handles it */
             --page-padding: 0mm;
          }
        }
      `}</style>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="brand">Web Novel Reader</div>
          <label className="file">
            <input
              type="file"
              accept=".md,text/markdown"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            <span>เลือกไฟล์ .md</span>
          </label>
        </div>
        <div className="toolbar-right">
          <button onClick={() => window.print()}>พิมพ์ / PDF</button>
        </div>
      </div>

      <div className="controls-bar">
        <div className="container">
          <label className="control">
            <span>ขนาดตัวอักษร</span>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSizePx}
              onChange={(e) => setFontSizePx(Number(e.target.value))}
            />
            <span className="value">{fontSizePx}px</span>
          </label>
          <label className="control">
            <span>ระยะบรรทัด</span>
            <input
              type="range"
              min={1.3}
              max={2.2}
              step={0.05}
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
            />
            <span className="value">{lineHeight.toFixed(2)}</span>
          </label>
          <label className="control">
            <span>ขอบกระดาษ (mm)</span>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={pagePaddingMm}
              onChange={(e) => setPagePaddingMm(Number(e.target.value))}
            />
            <span className="value">{pagePaddingMm}</span>
          </label>
          <label className="control">
            <span>ขอบบน (mm)</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={pageTopPaddingMm}
              onChange={(e) => setPageTopPaddingMm(Number(e.target.value))}
            />
            <span className="value">{pageTopPaddingMm}</span>
          </label>
        </div>
      </div>

      <div className="content">
        {!markdown ? (
          <div className="empty">
            <div className="empty-title">เลือกไฟล์นิยาย .md เพื่อเริ่มอ่าน</div>
            <div className="empty-sub">
              แนะนำ: เลือกไฟล์ <code>novel-project8/episodes/คุณหนูกับคนขับรถ.md</code>
            </div>
          </div>
        ) : (
          <div className="paper">
            {pages.map((pageContent, index) => (
              <div key={index} className="sheet-wrapper">
                <div className="novel">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                  >
                    {pageContent}
                  </ReactMarkdown>
                  <div className="page-number">
                    หน้า {index + 1} / {pages.length}
                  </div>
                </div>
                {/* Add a page break after every sheet except the last one */}
                {index < pages.length - 1 && <div className="page-break" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
