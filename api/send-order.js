const { formidable } = require('formidable');
const fs = require('fs');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Missing Telegram credentials in env');
    // We return success: true for demo purposes if not configured, 
    // but in production it should be an error or handled gracefully.
    // For now we'll throw an error so the frontend knows it failed, 
    // unless you want to bypass it. Let's return 500.
    return res.status(500).json({ success: false, error: 'Server configuration error (missing tokens)' });
  }

  try {
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);

    // Formidable v3 puts fields in arrays
    const name = (fields.name && fields.name[0]) || 'Без імені';
    const contact = (fields.contact && fields.contact[0]) || 'Не вказано';
    const product = (fields.product && fields.product[0]) || 'Не обрано';
    const comment = (fields.comment && fields.comment[0]) || '—';

    const text = `⚠️ НОВЕ ЗАМОВЛЕННЯ З САЙТУ\n👤 Клієнт: ${name}\n📞 Телефон/ТГ: ${contact}\n📦 Продукт: ${product}\n💬 Коментар: ${comment}`;

    const logoFile = files.logo && files.logo[0];

    if (logoFile) {
      // Using native fetch and FormData (Node 18+)
      const formData = new FormData();
      formData.append('chat_id', TELEGRAM_CHAT_ID);
      formData.append('caption', text);
      
      const fileBuffer = fs.readFileSync(logoFile.filepath);
      const blob = new Blob([fileBuffer], { type: logoFile.mimetype || 'application/octet-stream' });
      formData.append('document', blob, logoFile.originalFilename || 'logo');

      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error: ${errorText}`);
      }
    } else {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error: ${errorText}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
