function generateOrderNumber() {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SB${ts}${rand}`;
}

module.exports = generateOrderNumber;
