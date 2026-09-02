const http = require('http');
http.get('http://localhost:5000/api/store/catalog/products?limit=2000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('Total returned products array length:', json.products.length);
    console.log('API Total property:', json.total);
  });
});
