import express from 'express';
import { ProductsService } from '@union.solutions/api/products';
import { ApiResponse, Product, ProductFilter, PaginatedResponse } from '@union.solutions/models';

const host = process.env['HOST'] ?? 'localhost';
const port = process.env['PORT'] ? Number(process.env['PORT']) : 3333;

const app = express();
const productsService = new ProductsService();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.get('/api/products', (req, res) => {
  try {
    const filter: ProductFilter = {};
    const q = req.query as Record<string, string | undefined>;

    if (q['category']) {
      filter.category = q['category'] as string;
    }
    if (q['minPrice']) {
      filter.minPrice = Number(q['minPrice']);
    }
    if (q['maxPrice']) {
      filter.maxPrice = Number(q['maxPrice']);
    }
    if (q['inStock'] !== undefined) {
      filter.inStock = q['inStock'] === 'true';
    }
    if (q['searchTerm']) {
      filter.searchTerm = q['searchTerm'] as string;
    }

    const page = q['page'] ? Number(q['page']) : 1;
    const pageSize = q['pageSize'] ? Number(q['pageSize']) : 12;

    const result = productsService.getAllProducts(filter, page, pageSize);

    const response: ApiResponse<PaginatedResponse<Product>> = {
      data: result,
      success: true,
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = productsService.getProductById(req.params['id'] ?? '');

    if (!product) {
      const response: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Product not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Product> = {
      data: product,
      success: true,
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.get('/api/products-metadata/categories', (req, res) => {
  try {
    const categories = productsService.getCategories();
    const response: ApiResponse<string[]> = {
      data: categories,
      success: true,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.get('/api/products-metadata/price-range', (req, res) => {
  try {
    const priceRange = productsService.getPriceRange();
    const response: ApiResponse<{ min: number; max: number }> = {
      data: priceRange,
      success: true,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
