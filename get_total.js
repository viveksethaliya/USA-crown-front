const http = require('http');
http.get('http://localhost:5000/api/store/catalog/products?limit=1', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Raw:', data));
});
