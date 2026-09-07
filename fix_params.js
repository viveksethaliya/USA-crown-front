const fs = require('fs');
const file = 't:/USA/crown2/frontend/src/app/(main)/categories/[slug]/page.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  'export async function generateMetadata({ params, searchParams }: PageProps) {\n  try {\n    const pageNum = searchParams.page ? parseInt(searchParams.page, 10) : 1;',
  'export async function generateMetadata(props: PageProps) {\n  try {\n    const params = await props.params;\n    const searchParams = await props.searchParams;\n    const pageNum = searchParams.page ? parseInt(searchParams.page, 10) : 1;'
);

c = c.replace(
  'export default async function CategoryPage({ params, searchParams }: PageProps) {\n  const pageNum = searchParams.page ? parseInt(searchParams.page, 10) : 1;',
  'export default async function CategoryPage(props: PageProps) {\n  const params = await props.params;\n  const searchParams = await props.searchParams;\n  const pageNum = searchParams.page ? parseInt(searchParams.page, 10) : 1;'
);

fs.writeFileSync(file, c);
console.log('Fixed async params');
