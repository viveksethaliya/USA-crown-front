const { resolveRobots } = require('../node_modules/next/dist/lib/metadata/resolvers/resolve-basics');

// Layout metadata:
const layoutMetadata = { robots: { index: false, follow: true } };

// Category page metadata (when products >= 3):
const categoryMetadata = { title: 'Test Category', robots: 'index, follow' };

// Next.js mergeMetadata logic (from node_modules/next/dist/lib/metadata/resolve-metadata.js lines 166-213):
function testMerge(layoutMeta, pageMeta) {
  let resolvedMetadata = {};
  
  // 1. Process layout
  if (layoutMeta.robots) {
    resolvedMetadata.robots = resolveRobots(layoutMeta.robots);
  }
  
  // 2. Process page
  if (pageMeta.robots) {
    resolvedMetadata.robots = resolveRobots(pageMeta.robots);
  }
  
  return resolvedMetadata;
}

console.log('Merged Metadata:', JSON.stringify(testMerge(layoutMetadata, categoryMetadata), null, 2));
