export function normalizeMetal(val: string): string {
  const map: Record<string, string> = {
    '14Y': '14K Yellow Gold',
    '14W': '14K White Gold',
    '14KT Yellow': '14K Yellow Gold',
    '14KT White': '14K White Gold',
    '18KT Yellow': '18K Yellow Gold',
    '18KT White': '18K White Gold',
    '14KT Pink': '14K Rose Gold',
    'Platinum': 'Platinum'
  };
  return map[val] || val;
}

export function generateProductDescription(product: any): string {
  // Extract metals
  let metals: string[] = [];
  if (product.attributes && Array.isArray(product.attributes)) {
    const metalAttr = product.attributes.find((a: any) => a.slug === 'metal');
    if (metalAttr && Array.isArray(metalAttr.values)) {
      metals = metalAttr.values.map((v: any) => normalizeMetal(v.value || v.name));
    }
  }

  let metalStr: string | null = null;
  if (metals.length >= 3) {
    metalStr = metals.slice(0, 3).join(', ') + (metals.length > 3 ? ', and more' : '');
  } else if (metals.length === 2) {
    metalStr = metals[0] + ' and ' + metals[1];
  } else if (metals.length === 1) {
    metalStr = metals[0];
  }

  // Use second category if available, otherwise first
  let primaryCategory: string | null = null;
  if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
    primaryCategory = product.categories.length > 1 ? product.categories[1].name : product.categories[0].name;
  }

  const name = product.name || '';

  if (metalStr && primaryCategory) {
    return `${name} — wholesale ${primaryCategory} finding available in ${metalStr}.`;
  } else if (metalStr) {
    return `${name} — wholesale jewelry finding available in ${metalStr}.`;
  } else if (primaryCategory) {
    return `${name} — wholesale ${primaryCategory} finding.`;
  } else {
    return `${name} — wholesale jewelry finding.`;
  }
}

export function generateProductTitle(product: any): string {
  const name = product.name || '';
  const defaultTitle = `${name} | Crown Findings`;
  
  if (defaultTitle.length > 60) {
    return name;
  }
  return defaultTitle;
}
