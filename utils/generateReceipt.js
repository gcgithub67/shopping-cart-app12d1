const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateReceiptPDF = async (order, items, user, res) => {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `receipt_${order.razorpay_order_id || order.id}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('Shopping Cart App', { align: 'center' });
  doc.fontSize(18).text('Bill Receipt / Tax Invoice', { align: 'center' });
  doc.moveDown();

  // Order Info
  doc.fontSize(12).font('Helvetica');
  doc.text(`Order ID: ${order.razorpay_order_id || 'ORD-' + order.id}`);
  doc.text(`Date: ${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}`);
  
  if (order.razorpay_payment_id) {
    doc.text(`Payment ID: ${order.razorpay_payment_id}`);
  }
  
  doc.text(`Status: ${order.status.toUpperCase()}`);
  doc.moveDown();

  // Shipping Address
  doc.fontSize(14).font('Helvetica-Bold').text('Shipping Address');
  doc.fontSize(12).font('Helvetica');
  
  if (user) {
    doc.text(user.name || 'Customer');
    if (user.shipping_address) doc.text(user.shipping_address);
    if (user.shipping_city || user.shipping_state) {
      const cityState = [user.shipping_city, user.shipping_state].filter(Boolean).join(', ');
      doc.text(cityState);
    }
    if (user.shipping_zip) doc.text(`PIN: ${user.shipping_zip}`);
    if (user.shipping_country) doc.text(user.shipping_country);
  } else {
    doc.text('Address not available');
  }
  
  doc.moveDown();

  // Items Table
  doc.fontSize(14).font('Helvetica-Bold').text('Items Purchased');
  doc.moveDown(0.5);

  let y = doc.y;
  const tableLeft = 50;

  // Headers
  doc.font('Helvetica-Bold');
  doc.text('Item', tableLeft, y);
  doc.text('Qty', 280, y);
  doc.text('Rate', 340, y);
  doc.text('Amount', 420, y);
  y += 25;

  doc.font('Helvetica');
  items.forEach(item => {
    const amount = item.price * item.quantity;
    doc.text(item.name, tableLeft, y, { width: 220 });
    doc.text(item.quantity.toString(), 280, y);
    doc.text(`₹${item.price}`, 340, y);
    doc.text(`₹${amount.toFixed(2)}`, 420, y);
    y += 22;
  });

  // Total
  doc.moveDown(1);
  doc.fontSize(16).font('Helvetica-Bold').text(
    `Grand Total: ₹${parseFloat(order.total_amount).toFixed(2)}`, 
    { align: 'right' }
  );

  // Footer
  doc.moveDown(2);
  doc.fontSize(10).font('Helvetica').text('Thank you for your purchase!', { align: 'center' });
  doc.text('This is a computer-generated receipt.', { align: 'center' });
  doc.text('For any queries, contact support@shoppingcartapp.com', { align: 'center' });

  doc.end();
};

module.exports = { generateReceiptPDF };