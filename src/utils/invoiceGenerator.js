const PDFDocument = require("pdfkit");

/**
 * Streams a PDF invoice directly to an HTTP response.
 * @param {import('express').Response} res
 * @param {object} order - Order instance (with OrderItems, User included)
 */
function generateInvoicePDF(res, order) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
  doc.pipe(res);

  // Header
  doc
    .fontSize(22)
    .fillColor("#e8748a")
    .text("Suka Beauty", 50, 50)
    .fillColor("#000")
    .fontSize(10)
    .text("Makeup & Skincare", 50, 78);

  doc.fontSize(16).text("INVOICE", 400, 50, { align: "right" });
  doc.fontSize(10).text(`Order #: ${order.orderNumber}`, 400, 72, { align: "right" });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 86, { align: "right" });

  doc.moveTo(50, 110).lineTo(560, 110).strokeColor("#e8e8e8").stroke();

  // Bill to
  doc.fontSize(12).fillColor("#000").text("Ship To:", 50, 125);
  doc
    .fontSize(10)
    .text(order.shippingName, 50, 142)
    .text(order.shippingPhone, 50, 156)
    .text(
      `${order.shippingLine1}${order.shippingLine2 ? ", " + order.shippingLine2 : ""}`,
      50,
      170
    )
    .text(`${order.shippingCity}, ${order.shippingState} - ${order.shippingPincode}`, 50, 184);

  doc.text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`, 350, 142);
  doc.text(`Status: ${order.status.replace(/_/g, " ").toUpperCase()}`, 350, 156);

  // Table header
  let y = 220;
  doc.fontSize(10).fillColor("#fff");
  doc.rect(50, y, 510, 22).fill("#1a1a1a");
  doc
    .fillColor("#fff")
    .text("Item", 60, y + 6)
    .text("Price", 320, y + 6)
    .text("Qty", 400, y + 6)
    .text("Total", 470, y + 6);

  y += 30;
  doc.fillColor("#000");
  order.OrderItems.forEach((item) => {
    doc
      .fontSize(10)
      .text(item.name, 60, y, { width: 240 })
      .text(`Rs. ${item.price.toFixed(2)}`, 320, y)
      .text(String(item.quantity), 400, y)
      .text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 470, y);
    y += 22;
  });

  y += 10;
  doc.moveTo(50, y).lineTo(560, y).strokeColor("#e8e8e8").stroke();
  y += 15;

  const totals = [
    ["Subtotal", order.subtotal],
    ["Shipping", order.shippingFee],
    ["Tax", order.tax],
    ["Discount", -order.discount],
  ];
  totals.forEach(([label, val]) => {
    doc.fontSize(10).text(label, 400, y).text(`Rs. ${val.toFixed(2)}`, 470, y);
    y += 18;
  });

  doc.fontSize(12).fillColor("#e8748a").text("Total", 400, y).text(`Rs. ${order.total.toFixed(2)}`, 470, y);

  doc
    .fontSize(9)
    .fillColor("#777")
    .text("Thank you for shopping with Suka Beauty!", 50, 750, { align: "center" });

  doc.end();
}

module.exports = generateInvoicePDF;
