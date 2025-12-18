const db = require('../db');

exports.addProduct = async (req, res) => {
  console.log("REQ BODY:", req.body);   // ✅ ADD THIS

  const { name, description, price, discounted_price, sort_order, image_url, category, sizes, extra_images } = req.body;

  if (!name || !price || !image_url) {
    return res.status(400).json({ error: 'Name, price, and image are required.' });
  }

  const sizesStr = Array.isArray(sizes) ? sizes.join(',') : sizes;

  try {
  const [result] = await db.query(
  `INSERT INTO products 
   SET name = ?, 
       description = ?, 
       price = ?, 
       image_url = ?, 
       category = ?, 
       sizes = ?, 
       discounted_price = ?, 
       sort_order=?,
       created_at = NOW()`,
  [name, description, price, image_url, category, sizesStr, discounted_price, Number(sort_order ?? 0)]
);


    const productId = result.insertId;

    if (Array.isArray(extra_images) && extra_images.length > 0) {
      const values = extra_images.map(img => [productId, img]);
      await db.query('INSERT INTO product_images (product_id, image_url) VALUES ?', [values]);
    }

    res.status(201).json({ message: 'Product added successfully.' });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Server error while adding product.' });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query(
  'SELECT * FROM products ORDER BY sort_order ASC'
);


    const products = rows.map(product => ({
      ...product,
      sizes: product.sizes ? product.sizes.split(',') : []
    }));

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const [[product]] = await db.query('SELECT * FROM products WHERE id = ?', [id]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    product.sizes = product.sizes ? product.sizes.split(',') : [];

    const [images] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [id]);
    product.extra_images = images.map(img => img.image_url);

    res.json(product);
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, discounted_price, sort_order, image_url, category, sizes, extra_images } = req.body;

  if (!id || !name || !description || !price || !image_url || !category) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sizesStr = Array.isArray(sizes) ? sizes.join(',') : sizes;

  try {
    const [result] = await db.query(
      'UPDATE products SET name = ?, description = ?, price = ?, discounted_price = ?, sort_order=?, image_url = ?, category = ?, sizes = ? WHERE id = ?',
      [name, description, price, discounted_price, Number(sort_order ?? 0), image_url, category, sizesStr, id]
    );

    if (Array.isArray(extra_images)) {
      await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);

      if (extra_images.length > 0) {
        const values = extra_images.map(img => [id, img]);
        await db.query('INSERT INTO product_images (product_id, image_url) VALUES ?', [values]);
      }
    }

    res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Server error during product update.' });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM products');
    const categories = rows.map(row => row.category);
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);

    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Server error while deleting product.' });
  }
};

exports.updateProductOrder = async (req, res) => {
  const  order  = req.body;

  if (!Array.isArray(order)) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  try {
    const promises = order.map(item =>
      db.query(
        "UPDATE products SET sort_order = ? WHERE id = ?",
        [item.sort_order, item.id]
      )
    );

    await Promise.all(promises);

    res.json({ message: "Product order updated successfully" });
  } catch (err) {
    console.error("Error updating product order:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
};
