import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Types } from 'mongoose';
import { Readable } from 'stream';
import { logger } from '../utils/logger';
import { ITicket } from '../interfaces';

interface ITicketData {
  id: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  userName: string;
  ticketType: string;
  price: number;
  qrCode: string;
}

class PDFServiceClass {
  private static instance: PDFServiceClass;

  private constructor() {}

  public static getInstance(): PDFServiceClass {
    if (!PDFServiceClass.instance) {
      PDFServiceClass.instance = new PDFServiceClass();
    }
    return PDFServiceClass.instance;
  }

  async generateTicketPDF(ticket: ITicket): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4' });
        const chunks: Buffer[] = [];

        // Handle document chunks
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Safely convert _id to string
        const ticketId = ticket._id instanceof Types.ObjectId 
          ? ticket._id.toString() 
          : String(ticket._id);

        // Extract ticket data
        const data: ITicketData = {
          id: ticketId,
          eventName: (ticket.eventId as any).title,
          eventDate: new Date((ticket.eventId as any).startDate).toLocaleDateString(),
          eventVenue: (ticket.eventId as any).venue?.name || 'Not specified',
          userName: (ticket.userId as any).username,
          ticketType: ticket.tier.name,
          price: ticket.tier.price,
          qrCode: ticket.qrCode
        };

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(data.qrCode);

        // Add content to PDF
        this.addTicketContent(doc, data, qrCodeDataUrl);

        doc.end();
      } catch (error) {
        logger.error('PDF generation error:', error);
        reject(error);
      }
    });
  }

  private addTicketContent(doc: PDFKit.PDFDocument, data: ITicketData, qrCodeDataUrl: string): void {
    // Add header
    doc.fontSize(24)
      .text('Event Ticket', { align: 'center' })
      .moveDown();

    // Add event details
    doc.fontSize(14)
      .text(`Event: ${data.eventName}`)
      .text(`Date: ${data.eventDate}`)
      .text(`Venue: ${data.eventVenue}`)
      .moveDown();

    // Add ticket details
    doc.fontSize(12)
      .text(`Ticket ID: ${data.id}`)
      .text(`Type: ${data.ticketType}`)
      .text(`Price: $${data.price}`)
      .text(`Attendee: ${data.userName}`)
      .moveDown();

    // Add QR code
    doc.image(qrCodeDataUrl, {
      fit: [150, 150],
      align: 'center'
    });

    // Add footer
    doc.fontSize(10)
      .moveDown()
      .fillColor('gray')
      .text('This ticket is non-transferable and must be presented at entry.', {
        align: 'center'
      });
  }
}

export const PDFService = PDFServiceClass.getInstance();
export const generateTicketPDF = (ticket: ITicket) => PDFService.generateTicketPDF(ticket);