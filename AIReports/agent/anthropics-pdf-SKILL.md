# PDF Skill - Anthropic Official

Source: https://github.com/anthropics/skills

---
name: pdf
description: "Use this skill whenever the user wants to do anything with PDF files..."
license: Proprietary
---

## Quick Start

```python
from pypdf import PdfReader, PdfWriter
reader = PdfReader("document.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text()
```

## Python Libraries

### pypdf - Basic Operations
- Merge PDFs
- Split PDFs
- Extract metadata
- Rotate pages
- Add watermark
- Password protection

### pdfplumber - Text and Table Extraction
- Extract text with layout
- Extract tables
- Advanced table extraction with pandas

### reportlab - Create PDFs
- Basic PDF creation
- Multi-page documents
- Subscripts and superscripts (use XML markup, NOT unicode)

## Command-Line Tools

| Task | Tool | Command |
|------|------|---------|
| Text extraction | pdftotext | `pdftotext -layout input.pdf output.txt` |
| Merge/split | qpdf | `qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf` |
| OCR | pytesseract | Convert to image first |
| Image extraction | pdfimages | `pdfimages -j input.pdf prefix` |

## Common Tasks
- Extract text from scanned PDFs (pytesseract + pdf2image)
- Merge multiple PDFs
- Split into individual pages
- Rotate pages
- Add watermark
- Password protection
