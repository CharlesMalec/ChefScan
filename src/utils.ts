export const getIngredientEmoji = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('tomate') || n.includes('tomato')) return '🍅';
  if (n.includes('poulet') || n.includes('chicken') || n.includes('dinde') || n.includes('turkey') || n.includes('volaille') || n.includes('poultry')) return '🍗';
  if (n.includes('lait') || n.includes('milk')) return '🥛';
  if (n.includes('oeuf') || n.includes('œuf') || n.includes('egg')) return '🥚';
  if (n.includes('beurre') || n.includes('butter')) return '🧈';
  if (n.includes('farine') || n.includes('flour')) return '🌾';
  if (n.includes('sucre') || n.includes('sugar')) return '🧂';
  if (n.includes('sel') || n.includes('salt')) return '🧂';
  if (n.includes('poivre') || n.includes('pepper')) return '🧂';
  if (n.includes('ail') || n.includes('garlic')) return '🧄';
  if (n.includes('oignon') || n.includes('onion')) return '🧅';
  if (n.includes('carotte') || n.includes('carrot')) return '🥕';
  if (n.includes('pomme de terre') || n.includes('patate') || n.includes('potato')) return '🥔';
  if (n.includes('pomme') || n.includes('apple')) return '🍎';
  if (n.includes('citron') || n.includes('lemon')) return '🍋';
  if (n.includes('orange')) return '🍊';
  if (n.includes('banane') || n.includes('banana')) return '🍌';
  if (n.includes('fraise') || n.includes('strawberry')) return '🍓';
  if (n.includes('framboise') || n.includes('raspberry')) return '🍇';
  if (n.includes('fromage') || n.includes('cheese') || n.includes('gruyère') || n.includes('parmesan') || n.includes('mozzarella')) return '🧀';
  if (n.includes('pain') || n.includes('bread') || n.includes('baguette')) return '🥖';
  if (n.includes('riz') || n.includes('rice')) return '🍚';
  if (n.includes('pâte') || n.includes('pasta') || n.includes('spaghetti') || n.includes('macaroni') || n.includes('nouille') || n.includes('noodle')) return '🍝';
  if (n.includes('viande') || n.includes('meat') || n.includes('boeuf') || n.includes('bœuf') || n.includes('beef') || n.includes('porc') || n.includes('pork') || n.includes('veau') || n.includes('veal') || n.includes('agneau') || n.includes('lamb')) return '🥩';
  if (n.includes('poisson') || n.includes('fish') || n.includes('saumon') || n.includes('salmon') || n.includes('cabillaud') || n.includes('cod') || n.includes('thon') || n.includes('tuna')) return '🐟';
  if (n.includes('crevette') || n.includes('shrimp') || n.includes('prawn') || n.includes('gambas')) return '🦐';
  if (n.includes('huile') || n.includes('oil')) return '🫒';
  if (n.includes('vinaigre') || n.includes('vinegar')) return '🍾';
  if (n.includes('chocolat') || n.includes('chocolate') || n.includes('cacao') || n.includes('cocoa')) return '🍫';
  if (n.includes('miel') || n.includes('honey')) return '🍯';
  if (n.includes('confiture') || n.includes('jam')) return '🍓';
  if (n.includes('champignon') || n.includes('mushroom')) return '🍄';
  if (n.includes('salade') || n.includes('salad') || n.includes('laitue') || n.includes('lettuce') || n.includes('mâche') || n.includes('roquette') || n.includes('arugula')) return '🥬';
  if (n.includes('épinard') || n.includes('epinard') || n.includes('spinach')) return '🍃';
  if (n.includes('avocat') || n.includes('avocado')) return '🥑';
  if (n.includes('noix') || n.includes('nut') || n.includes('noisette') || n.includes('hazelnut') || n.includes('pécan') || n.includes('pecan')) return '🥜';
  if (n.includes('amande') || n.includes('almond')) return '🌰';
  if (n.includes('eau') || n.includes('water')) return '💧';
  if (n.includes('vin') || n.includes('wine')) return '🍷';
  if (n.includes('bière') || n.includes('biere') || n.includes('beer')) return '🍺';
  if (n.includes('café') || n.includes('cafe') || n.includes('coffee')) return '☕';
  if (n.includes('thé') || n.includes('the') || n.includes('tea')) return '🍵';
  if (n.includes('crème') || n.includes('creme') || n.includes('cream')) return '🥛';
  if (n.includes('moutarde') || n.includes('mustard')) return '🌭';
  if (n.includes('mayonnaise')) return '🥚';
  if (n.includes('ketchup')) return '🍅';
  if (n.includes('sauce')) return '🥣';
  if (n.includes('herbe') || n.includes('herb') || n.includes('persil') || n.includes('parsley') || n.includes('ciboulette') || n.includes('chive') || n.includes('basilic') || n.includes('basil') || n.includes('coriandre') || n.includes('cilantro') || n.includes('thym') || n.includes('thyme') || n.includes('romarin') || n.includes('rosemary')) return '🌿';
  if (n.includes('piment') || n.includes('chili') || n.includes('pepper')) return '🌶️';
  if (n.includes('poivron') || n.includes('bell pepper')) return '🫑';
  if (n.includes('brocoli') || n.includes('broccoli')) return '🥦';
  if (n.includes('chou') || n.includes('cabbage')) return '🥬';
  if (n.includes('aubergine') || n.includes('eggplant')) return '🍆';
  if (n.includes('courgette') || n.includes('zucchini')) return '🥒';
  if (n.includes('concombre') || n.includes('cucumber')) return '🥒';
  if (n.includes('melon')) return '🍈';
  if (n.includes('pastèque') || n.includes('pasteque') || n.includes('watermelon')) return '🍉';
  if (n.includes('raisin') || n.includes('grape')) return '🍇';
  if (n.includes('pêche') || n.includes('peche') || n.includes('peach')) return '🍑';
  if (n.includes('cerise') || n.includes('cherry')) return '🍒';
  if (n.includes('poire') || n.includes('pear')) return '🍐';
  if (n.includes('ananas') || n.includes('pineapple')) return '🍍';
  if (n.includes('mangue') || n.includes('mango')) return '🥭';
  if (n.includes('kiwi')) return '🥝';
  if (n.includes('myrtille') || n.includes('blueberry')) return '🫐';
  if (n.includes('olive')) return '🫒';
  if (n.includes('maïs') || n.includes('mais') || n.includes('corn')) return '🌽';
  if (n.includes('pois') || n.includes('pea')) return '🫛';
  if (n.includes('haricot') || n.includes('bean')) return '🫘';
  if (n.includes('lentille') || n.includes('lentil')) return '🫘';
  if (n.includes('soja') || n.includes('soy')) return '🌱';
  if (n.includes('tofu')) return '🧊';
  if (n.includes('bacon') || n.includes('lard')) return '🥓';
  if (n.includes('saucisse') || n.includes('sausage')) return '🌭';
  if (n.includes('jambon') || n.includes('ham')) return '🍖';
  if (n.includes('burger')) return '🍔';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('frite') || n.includes('fry')) return '🍟';
  if (n.includes('glace') || n.includes('ice cream')) return '🍦';
  if (n.includes('gâteau') || n.includes('gateau') || n.includes('cake')) return '🍰';
  if (n.includes('biscuit') || n.includes('cookie')) return '🍪';
  if (n.includes('croissant')) return '🥐';
  if (n.includes('crêpe') || n.includes('crepe') || n.includes('pancake')) return '🥞';
  if (n.includes('gaufre') || n.includes('waffle')) return '🧇';
  if (n.includes('soupe') || n.includes('soup')) return '🍲';
  if (n.includes('bouillon') || n.includes('broth')) return '🥣';
  if (n.includes('levure') || n.includes('yeast')) return '🫧';
  if (n.includes('vanille') || n.includes('vanilla')) return '🍦';
  if (n.includes('cannelle') || n.includes('cinnamon')) return '🪵';
  
  return '🛒'; // Default emoji
};

export const formatUnit = (amount: number | string, unit: string): string => {
  if (!unit || unit === 'null' || unit === 'undefined') return '';
  
  const u = unit.toLowerCase().trim();
  const total = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;

  // Remove redundant units
  const redundant = ['entier', 'entière', 'entiers', 'entières', 'unité', 'unités', 'whole', 'unit', 'units', 'piece', 'pieces'];
  if (redundant.includes(u)) {
    return '';
  }

  if (total >= 2) {
    // French plurals
    if (u === 'gousse') return 'gousses';
    if (u === 'cuillère') return 'cuillères';
    if (u === 'pincée') return 'pincées';
    if (u === 'tranche') return 'tranches';
    if (u === 'pot') return 'pots';
    if (u === 'boîte' || u === 'boite') return 'boîtes';
    if (u === 'sachet') return 'sachets';
    if (u === 'verre') return 'verres';
    if (u === 'filet') return 'filets';
    if (u === 'pavé' || u === 'pave') return 'pavés';
    if (u === 'steak') return 'steaks';
    if (u === 'escalope') return 'escalopes';

    // English plurals (simple cases)
    if (u === 'clove') return 'cloves';
    if (u === 'spoon') return 'spoons';
    if (u === 'pinch') return 'pinches';
    if (u === 'slice') return 'slices';
    if (u === 'jar') return 'jars';
    if (u === 'box') return 'boxes';
    if (u === 'packet') return 'packets';
    if (u === 'glass') return 'glasses';
    if (u === 'cl') return 'cl';
    if (u === 'ml') return 'ml';
    if (u === 'g') return 'g';
    if (u === 'kg') return 'kg';
  }

  return unit.trim();
};
