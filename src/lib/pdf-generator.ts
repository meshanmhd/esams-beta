import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface SeatAllocationData {
  exam: {
    title: string
    subject: string
    exam_date: string
    start_time: string
    end_time: string
    hall: {
      name: string
      location?: string
    }
  }
  allocations: Array<{
    student: {
      full_name: string
      student_id?: string
      email: string
    }
    seat: {
      seat_number: string
      row_number?: number
      column_number?: number
    }
  }>
}

export async function generateSeatAllocationPDF(data: SeatAllocationData): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  
  // Add a page
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  // Colors
  const black = rgb(0, 0, 0)
  const gray = rgb(0.5, 0.5, 0.5)
  const lightGray = rgb(0.9, 0.9, 0.9)
  
  let yPosition = height - 50
  
  // Title
  page.drawText('SEAT ALLOCATION SHEET', {
    x: 50,
    y: yPosition,
    size: 20,
    font: boldFont,
    color: black,
  })
  
  yPosition -= 40
  
  // Exam Information
  page.drawText('Exam Information:', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: black,
  })
  
  yPosition -= 25
  
  const examInfo = [
    `Title: ${data.exam.title}`,
    `Subject: ${data.exam.subject}`,
    `Date: ${data.exam.exam_date}`,
    `Time: ${data.exam.start_time} - ${data.exam.end_time}`,
    `Hall: ${data.exam.hall.name}`,
    ...(data.exam.hall.location ? [`Location: ${data.exam.hall.location}`] : []),
  ]
  
  examInfo.forEach((info) => {
    page.drawText(info, {
      x: 70,
      y: yPosition,
      size: 12,
      font: font,
      color: black,
    })
    yPosition -= 18
  })
  
  yPosition -= 20
  
  // Table header
  const tableWidth = width - 100
  const colWidths = [80, 200, 100, 80, 80] // Student ID, Name, Email, Seat, Row/Col
  const rowHeight = 25
  
  // Draw table header background
  page.drawRectangle({
    x: 50,
    y: yPosition - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: lightGray,
  })
  
  // Draw table header text
  const headers = ['Student ID', 'Full Name', 'Email', 'Seat', 'Row/Col']
  let xPosition = 50
  
  headers.forEach((header, index) => {
    page.drawText(header, {
      x: xPosition + 5,
      y: yPosition - 18,
      size: 10,
      font: boldFont,
      color: black,
    })
    xPosition += colWidths[index]
  })
  
  yPosition -= rowHeight
  
  // Draw table rows
  data.allocations.forEach((allocation, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 50,
        y: yPosition - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      })
    }
    
    xPosition = 50
    
    // Student ID
    page.drawText(allocation.student.student_id || 'N/A', {
      x: xPosition + 5,
      y: yPosition - 18,
      size: 9,
      font: font,
      color: black,
    })
    xPosition += colWidths[0]
    
    // Full Name
    page.drawText(allocation.student.full_name, {
      x: xPosition + 5,
      y: yPosition - 18,
      size: 9,
      font: font,
      color: black,
    })
    xPosition += colWidths[1]
    
    // Email
    const email = allocation.student.email.length > 20 
      ? allocation.student.email.substring(0, 17) + '...'
      : allocation.student.email
    page.drawText(email, {
      x: xPosition + 5,
      y: yPosition - 18,
      size: 9,
      font: font,
      color: black,
    })
    xPosition += colWidths[2]
    
    // Seat Number
    page.drawText(allocation.seat.seat_number, {
      x: xPosition + 5,
      y: yPosition - 18,
      size: 9,
      font: font,
      color: black,
    })
    xPosition += colWidths[3]
    
    // Row/Column
    const rowCol = allocation.seat.row_number && allocation.seat.column_number
      ? `${allocation.seat.row_number}/${allocation.seat.column_number}`
      : 'N/A'
    page.drawText(rowCol, {
      x: xPosition + 5,
      y: yPosition - 18,
      size: 9,
      font: font,
      color: black,
    })
    
    yPosition -= rowHeight
    
    // Check if we need a new page
    if (yPosition < 100) {
      const newPage = pdfDoc.addPage([595.28, 841.89])
      yPosition = newPage.getSize().height - 50
      
      // Draw table header on new page
      newPage.drawRectangle({
        x: 50,
        y: yPosition - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: lightGray,
      })
      
      xPosition = 50
      headers.forEach((header, index) => {
        newPage.drawText(header, {
          x: xPosition + 5,
          y: yPosition - 18,
          size: 10,
          font: boldFont,
          color: black,
        })
        xPosition += colWidths[index]
      })
      
      yPosition -= rowHeight
    }
  })
  
  // Footer
  const footerY = 50
  page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: footerY,
    size: 10,
    font: font,
    color: gray,
  })
  
  page.drawText(`Total Students: ${data.allocations.length}`, {
    x: width - 150,
    y: footerY,
    size: 10,
    font: font,
    color: gray,
  })
  
  // Serialize the PDF
  return await pdfDoc.save()
}

export async function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  // Create a new Uint8Array to ensure we have a proper ArrayBuffer
  const bytes = new Uint8Array(pdfBytes)
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
