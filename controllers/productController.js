const db = require('../db');

/* =====================================================
   ADD PRODUCT
===================================================== */
exports.addProduct = async (req, res) => {
  console.log("REQ BODY:", req.body);

  const {
    name,
    description,
    price,
    discounted_price,
    sort_order,
    image_url,
    category,
    quantity_unit,
    sizes,
    extra_images,
    colors
  } = req.body;

  /* -------- VALIDATION -------- */
  if (!name || !price || !image_url || !category || !quantity_unit) {
    return res.status(400).json({
      error: 'Name, price, image, category and quantity unit are required.'
    });
  }

  /* -------- NORMALIZATION -------- */
  const normalizedSizes =
    Array.isArray(sizes)
      ? sizes.join(',')
      : typeof sizes === 'string'
      ? sizes
      : '';

  const normalizedColors =
    Array.isArray(colors)
      ? colors.join(',')
      : typeof colors === 'string'
      ? colors
      : '';

  const normalizedExtraImages =
    Array.isArray(extra_images)
      ? extra_images
      : typeof extra_images === 'string'
      ? extra_images.split(',').map(s => s.trim())
      : [];

  try {
    /* -------- INSERT PRODUCT -------- */
    const [result] = await db.query(
      `INSERT INTO products
       (name, description, price, discounted_price, image_url,
        category, quantity_unit, sizes, colors, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        description || null,
        price,
        discounted_price || null,
        image_url,
        category,
        quantity_unit,
        normalizedSizes,
        normalizedColors,
        Number(sort_order ?? 0)
      ]
    );

    const productId = result.insertId;

    /* -------- EXTRA IMAGES -------- */
    if (normalizedExtraImages.length > 0) {
      const values = normalizedExtraImages.map(img => [productId, img]);
      await db.query(
        'INSERT INTO product_images (product_id, image_url) VALUES ?',
        [values]
      );
    }

    res.status(201).json({ message: 'Product added successfully.' });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Server error while adding product.' });
  }
};

/* =====================================================
   GET ALL PRODUCTS (OPTIONAL COLOR FILTER)
===================================================== */
exports.getAllProducts = async (req, res) => {
  try {
    const { color } = req.query;

    const query = `
      SELECT * FROM products
      ${color ? 'WHERE FIND_IN_SET(?, colors)' : ''}
      ORDER BY sort_order ASC, created_at DESC
    `;

    const params = color ? [color.toLowerCase()] : [];
    const [rows] = await db.query(query, params);

    const products = rows.map(product => ({
      ...product,
      sizes: product.sizes ? product.sizes.split(',') : [],
      colors: product.colors ? product.colors.split(',') : []
    }));

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* =====================================================
   GET PRODUCT BY ID
===================================================== */
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const [[product]] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    product.sizes = product.sizes ? product.sizes.split(',') : [];
    product.colors = product.colors ? product.colors.split(',') : [];

    const [images] = await db.query(
      'SELECT image_url FROM product_images WHERE product_id = ?',
      [id]
    );

    product.extra_images = images.map(img => img.image_url);

    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* =====================================================
   UPDATE PRODUCT
===================================================== */
exports.updateProduct = async (req, res) => {
  const { id } = req.params;

  const {
    name,
    description,
    price,
    discounted_price,
    sort_order,
    image_url,
    category,
    quantity_unit,
    sizes,
    extra_images,
    colors
  } = req.body;

  if (!id || !name || !price || !image_url || !category || !quantity_unit) {
    return res.status(400).json({ error: 'All required fields missing.' });
  }

  const normalizedSizes =
    Array.isArray(sizes)
      ? sizes.join(',')
      : typeof sizes === 'string'
      ? sizes
      : '';

  const normalizedColors =
    Array.isArray(colors)
      ? colors.join(',')
      : typeof colors === 'string'
      ? colors
      : '';

  const normalizedExtraImages =
    Array.isArray(extra_images)
      ? extra_images
      : typeof extra_images === 'string'
      ? extra_images.split(',').map(s => s.trim())
      : [];

  try {
    await db.query(
      `UPDATE products
       SET name = ?, description = ?, price = ?, discounted_price = ?,
           image_url = ?, category = ?, quantity_unit = ?,
           sizes = ?, colors = ?, sort_order = ?
       WHERE id = ?`,
      [
        name,
        description || null,
        price,
        discounted_price || null,
        image_url,
        category,
        quantity_unit,
        normalizedSizes,
        normalizedColors,
        Number(sort_order ?? 0),
        id
      ]
    );

    /* RESET EXTRA IMAGES */
    await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);

    if (normalizedExtraImages.length > 0) {
      const values = normalizedExtraImages.map(img => [id, img]);
      await db.query(
        'INSERT INTO product_images (product_id, image_url) VALUES ?',
        [values]
      );
    }

    res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Server error during product update.' });
  }
};

/* =====================================================
   DELETE PRODUCT
===================================================== */
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

/* =====================================================
   GET ALL CATEGORIES
===================================================== */
exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM products');
    res.json(rows.map(row => row.category));
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

/* =====================================================
   UPDATE PRODUCT ORDER (DRAG & DROP)
===================================================== */
exports.updateProductOrder = async (req, res) => {
  const order = req.body;

  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'Invalid order data.' });
  }

  try {
    await Promise.all(
      order.map(item =>
        db.query(
          'UPDATE products SET sort_order = ? WHERE id = ?',
          [Number(item.sort_order), Number(item.id)]
        )
      )
    );

    res.json({ message: 'Product order updated successfully.' });
  } catch (err) {
    console.error('Error updating product order:', err);
    res.status(500).json({ error: 'Failed to update order.' });
  }
};
