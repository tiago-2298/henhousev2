interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
}

const WEBHOOKS = {
  sales: 'https://discord.com/api/webhooks/1412851967314759710/wkYvFM4ek4ZZHoVw_t5EPL9jUv7_mkqeLJzENHw6MiGjHvwRknAHhxPOET9y-fc1YDiG',
  production: 'https://discord.com/api/webhooks/1389343371742412880/3OGNAmoMumN5zM2Waj8D2f05gSuilBi0blMMW02KXOGLNbkacJs2Ax6MYO4Menw19dJy',
  b2b: 'https://discord.com/api/webhooks/1389356140957274112/6AcD2wMTkn9_1lnZNpm4fOsXxGk0sZR5us-rWSrbdTBScu6JYbMtWi31No6wbepeg607',
  garage: 'https://discord.com/api/webhooks/1392213573668962475/uAp9DZrX3prvwTk050bSImOSPXqI3jxxMXm2P8VIFQvC5Kwi5G2RGgG6wv1H5Hp0sGX9',
  security: 'https://discord.com/api/webhooks/1424558367938183168/ehfzI0mB_aWYXz7raPsQQ8x6KaMRPe7mNzvtdbg73O6fb9DyR7HdFll1gpR7BNnbCDI_',
  admin: 'https://discord.com/api/webhooks/1424558367938183168/ehfzI0mB_aWYXz7raPsQQ8x6KaMRPe7mNzvtdbg73O6fb9DyR7HdFll1gpR7BNnbCDI_',
};

async function sendWebhook(url: string, embeds: DiscordEmbed[]) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embeds }),
    });
  } catch (error) {
    console.error('Discord webhook error:', error);
  }
}

export async function notifySale(data: {
  employeeName: string;
  invoiceNumber: string;
  total: number;
  paymentMethod: string;
  items: Array<{ product: string; quantity: number; price: number }>;
}) {
  const embed: DiscordEmbed = {
    title: '💰 Nouvelle Vente',
    description: `Facture N°${data.invoiceNumber} par ${data.employeeName}`,
    color: 0x00ff00,
    fields: [
      { name: 'Montant Total', value: `€${data.total.toFixed(2)}`, inline: true },
      { name: 'Paiement', value: data.paymentMethod, inline: true },
      { name: 'Produits', value: data.items.map(i => `${i.quantity}x ${i.product} (€${i.price})`).join('\n'), inline: false },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(WEBHOOKS.sales, [embed]);
}

export async function notifyProduction(data: {
  employeeName: string;
  productName: string;
  quantity: number;
  ingredientsUsed: Array<{ name: string; quantity: number; unit: string }>;
}) {
  const embed: DiscordEmbed = {
    title: '🍳 Production',
    description: `Production par ${data.employeeName}`,
    color: 0xff9500,
    fields: [
      { name: 'Produit', value: data.productName, inline: true },
      { name: 'Quantité', value: `${data.quantity}`, inline: true },
      {
        name: 'Ingrédients Utilisés',
        value: data.ingredientsUsed.map(i => `${i.quantity}${i.unit} ${i.name}`).join('\n') || 'Aucun',
        inline: false
      },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(WEBHOOKS.production, [embed]);
}

export async function notifyLowStock(data: {
  itemName: string;
  quantity: number;
  type: 'Produit' | 'Ingrédient';
}) {
  const embed: DiscordEmbed = {
    title: '⚠️ Stock Faible',
    description: `${data.type}: ${data.itemName}`,
    color: 0xff0000,
    fields: [
      { name: 'Stock Restant', value: `${data.quantity}`, inline: true },
      { name: 'Type', value: data.type, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(WEBHOOKS.production, [embed]);
}

export async function notifyB2BSale(data: {
  partnerName: string;
  employeeName: string;
  invoiceNumber: string;
  total: number;
  items: Array<{ product: string; quantity: number }>;
}) {
  const embed: DiscordEmbed = {
    title: '🤝 Vente B2B',
    description: `Partenaire: ${data.partnerName}`,
    color: 0x0099ff,
    fields: [
      { name: 'Facture', value: data.invoiceNumber, inline: true },
      { name: 'Montant', value: `€${data.total.toFixed(2)}`, inline: true },
      { name: 'Vendeur', value: data.employeeName, inline: true },
      { name: 'Produits', value: data.items.map(i => `${i.quantity}x ${i.product}`).join('\n'), inline: false },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(WEBHOOKS.b2b, [embed]);
}

export async function notifyVehicleAction(data: {
  employeeName: string;
  vehicleName: string;
  action: 'Sortie' | 'Retour';
  fuelLevel: number;
  condition: string;
  notes?: string;
}) {
  const embed: DiscordEmbed = {
    title: data.action === 'Sortie' ? '🚗 Sortie Véhicule' : '🏁 Retour Véhicule',
    description: `${data.vehicleName} - ${data.employeeName}`,
    color: data.action === 'Sortie' ? 0xffcc00 : 0x00cc00,
    fields: [
      { name: 'Essence', value: `${data.fuelLevel}%`, inline: true },
      { name: 'État', value: data.condition, inline: true },
      ...(data.notes ? [{ name: 'Notes', value: data.notes, inline: false }] : []),
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(WEBHOOKS.garage, [embed]);
}

export async function notifyExpense(data: {
  employeeName: string;
  type: string;
  amount: number;
  description: string;
  vehicleName?: string;
}) {
  const embed: DiscordEmbed = {
    title: '💸 Dépense',
    description: `Par ${data.employeeName}`,
    color: 0xff6600,
    fields: [
      { name: 'Type', value: data.type, inline: true },
      { name: 'Montant', value: `€${data.amount.toFixed(2)}`, inline: true },
      ...(data.vehicleName ? [{ name: 'Véhicule', value: data.vehicleName, inline: true }] : []),
      { name: 'Description', value: data.description, inline: false },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(WEBHOOKS.garage, [embed]);
}

export async function notifyLoss(data: {
  employeeName: string;
  itemType: string;
  itemName: string;
  quantity: number;
  reason: string;
}) {
  const embed: DiscordEmbed = {
    title: '❌ Perte Déclarée',
    description: `Par ${data.employeeName}`,
    color: 0xff0000,
    fields: [
      { name: 'Type', value: data.itemType, inline: true },
      { name: 'Item', value: data.itemName, inline: true },
      { name: 'Quantité', value: `${data.quantity}`, inline: true },
      { name: 'Raison', value: data.reason, inline: false },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(WEBHOOKS.production, [embed]);
}

export async function notifySecurityAlert(data: {
  action: string;
  employeeName: string;
  details: string;
}) {
  const embed: DiscordEmbed = {
    title: '🚨 Alerte Sécurité',
    description: data.action,
    color: 0xff0000,
    fields: [
      { name: 'Employé', value: data.employeeName, inline: true },
      { name: 'Détails', value: data.details, inline: false },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook(WEBHOOKS.security, [embed]);
}

export async function notifyAdminAction(data: {
  employeeName: string;
  actionType: 'create' | 'update' | 'delete' | 'settings_change' | 'permission_change' | 'logo_change';
  moduleName: string;
  details: string;
}) {
  const actionColors: Record<string, number> = {
    create: 0x10B981,
    update: 0x3B82F6,
    delete: 0xEF4444,
    settings_change: 0xF59E0B,
    permission_change: 0x8B5CF6,
    logo_change: 0x06B6D4
  };

  const actionIcons: Record<string, string> = {
    create: '➕',
    update: '✏️',
    delete: '🗑️',
    settings_change: '⚙️',
    permission_change: '🔐',
    logo_change: '🖼️'
  };

  const actionLabels: Record<string, string> = {
    create: 'Création',
    update: 'Modification',
    delete: 'Suppression',
    settings_change: 'Paramètre modifié',
    permission_change: 'Permission modifiée',
    logo_change: 'Logo modifié'
  };

  const embed: DiscordEmbed = {
    title: `${actionIcons[data.actionType] || '📝'} Action Admin: ${actionLabels[data.actionType]}`,
    description: `Module: ${data.moduleName}`,
    color: actionColors[data.actionType] || 0x6B7280,
    fields: [
      { name: 'Admin', value: data.employeeName, inline: true },
      { name: 'Détails', value: data.details, inline: false }
    ],
    timestamp: new Date().toISOString()
  };

  await sendWebhook('admin_actions', [embed]);
}
