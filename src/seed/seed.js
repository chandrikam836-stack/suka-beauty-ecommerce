require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, User, Category, Product } = require("../models");

async function seed() {
  await sequelize.sync();

  // ---- Admin user ----
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sukabeauty.com";
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@12345", 10);
    await User.create({
      name: "Suka Beauty Admin",
      email: adminEmail,
      password: hashed,
      role: "admin",
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log("Admin already exists, skipping.");
  }

  // ---- Categories ----
  const categoryNames = ["Makeup", "Skincare", "Haircare", "Fragrance", "Bath & Body"];
  const categories = {};
  for (const name of categoryNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/&/g, "and");
    const [cat] = await Category.findOrCreate({ where: { name }, defaults: { slug } });
    categories[name] = cat;
  }
  console.log("Categories seeded.");

  // ---- Sample products ----
  const sampleProducts = [
    {
      name: "Velvet Matte Liquid Lipstick",
      brand: "Suka",
      category: "Makeup",
      skinType: "All",
      price: 599,
      discountPrice: 449,
      stock: 50,
      description: "Long-lasting, transfer-proof matte lipstick in a rich pigmented formula.",
      images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500"],
    },
    {
      name: "Hydrating Vitamin C Serum",
      brand: "GlowLab",
      category: "Skincare",
      skinType: "All",
      price: 899,
      discountPrice: 699,
      stock: 40,
      description: "Brightening serum with 15% Vitamin C to even skin tone and boost radiance.",
      images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500"],
    },
    {
      name: "Argan Oil Nourishing Shampoo",
      brand: "PureLocks",
      category: "Haircare",
      skinType: "All",
      price: 449,
      stock: 60,
      description: "Sulfate-free shampoo enriched with argan oil for smooth, frizz-free hair.",
      images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500"],
    },
    {
      name: "Rose & Oud Eau de Parfum",
      brand: "Suka",
      category: "Fragrance",
      skinType: "All",
      price: 1499,
      discountPrice: 1199,
      stock: 25,
      description: "A warm, sensual fragrance blending Bulgarian rose with smoky oud.",
      images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=500"],
    },
    {
      name: "Oatmeal Body Wash",
      brand: "PureBody",
      category: "Bath & Body",
      skinType: "Dry",
      price: 349,
      stock: 70,
      description: "Gentle soap-free body wash with colloidal oatmeal for sensitive, dry skin.",
      images: ["https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=500"],
    },
    {
      name: "Oil-Control Clay Face Mask",
      brand: "GlowLab",
      category: "Skincare",
      skinType: "Oily",
      price: 549,
      discountPrice: 399,
      stock: 45,
      description: "Deep-cleansing kaolin clay mask that absorbs excess oil and minimizes pores.",
      images: ["https://images.unsplash.com/photo-1571875257727-256c39da42af?w=500"],
    },
  ];

  for (const p of sampleProducts) {
    const existing = await Product.findOne({ where: { name: p.name } });
    if (existing) continue;
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-5);
    await Product.create({
      name: p.name,
      slug,
      description: p.description,
      brand: p.brand,
      skinType: p.skinType,
      price: p.price,
      discountPrice: p.discountPrice || null,
      stock: p.stock,
      categoryId: categories[p.category].id,
      images: p.images,
    });
  }
  console.log("Sample products seeded.");

  console.log("\nSeed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
