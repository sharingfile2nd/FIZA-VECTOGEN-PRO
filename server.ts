import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Built-in Microstock Database for 12 months (Instant zero-downtime fallback)
const CURATED_MONTHLY_EVENTS: Record<
  string,
  Array<{ date: string; eventName: string; category: string; commercialValue: string }>
> = {
  Januari: [
    { date: '01 Jan', eventName: 'Tahun Baru Global (New Year Celebration & Fireworks)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: '15 Jan', eventName: 'Martin Luther King Jr. Day (Civil Rights & Peace)', category: 'Culture', commercialValue: 'Trending' },
    { date: '22 Jan', eventName: 'Tahun Baru Imlek (Lunar New Year & Zodiac Dragon/Snake)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: '24 Jan', eventName: 'Hari Pendidikan Internasional (International Day of Education)', category: 'Icon Set', commercialValue: 'Evergreen' },
    { date: '26 Jan', eventName: 'Australia Day & Summer BBQ Vibes', category: 'Seasonal', commercialValue: 'Trending' },
    { date: 'Late Jan', eventName: 'Winter Sports & Snowboarding Geometric Glyphs', category: 'Sports', commercialValue: 'Evergreen' },
    { date: 'Late Jan', eventName: 'Pajak & Finansial Awal Tahun (Tax Season Flat Icons)', category: 'Business', commercialValue: 'High Demand' },
    { date: 'Late Jan', eventName: 'Resolusi Kebugaran & Gym (Fitness & Healthy Diet)', category: 'Lifestyle', commercialValue: 'High Demand' },
  ],
  Februari: [
    { date: '04 Feb', eventName: 'Hari Kanker Sedunia (World Cancer Day Ribbon & Hope)', category: 'Health', commercialValue: 'Trending' },
    { date: '10 Feb', eventName: 'Karnaval Rio & Mardi Gras Festive Masquerade', category: 'Festival', commercialValue: 'Trending' },
    { date: '14 Feb', eventName: 'Hari Valentine (Love, Hearts & Romance Doodles)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: '20 Feb', eventName: 'Hari Keadilan Sosial Sedunia (Social Justice & Unity)', category: 'Social', commercialValue: 'Evergreen' },
    { date: 'Mid Feb', eventName: 'Fashion Week Runway & Apparel Line Art', category: 'Fashion', commercialValue: 'Trending' },
    { date: 'Late Feb', eventName: 'Musim Semi Awal (Spring Bloom & Botanical Foliage)', category: 'Botanical', commercialValue: 'High Demand' },
    { date: 'Late Feb', eventName: 'Cyber Security & Privacy Tech Glyph Icons', category: 'Technology', commercialValue: 'High Demand' },
    { date: 'Late Feb', eventName: 'Piala Olahraga Musim Dingin (Ice Hockey & Skiing)', category: 'Sports', commercialValue: 'Trending' },
  ],
  Maret: [
    { date: '03 Mar', eventName: 'Hari Margasatwa Sedunia (World Wildlife & Animals)', category: 'Animals', commercialValue: 'High Demand' },
    { date: '08 Mar', eventName: 'Hari Perempuan Internasional (International Women Day)', category: 'Culture', commercialValue: 'High Demand' },
    { date: '10 Mar', eventName: 'Menyambut Bulan Suci Ramadhan (Ketupat & Crescent Moon)', category: 'Religion', commercialValue: 'High Demand' },
    { date: '17 Mar', eventName: "St. Patrick's Day (Shamrock & Irish Luck)", category: 'Holiday', commercialValue: 'High Demand' },
    { date: '20 Mar', eventName: 'Equinox Musim Semi (Spring Equinox Floral Garden)', category: 'Botanical', commercialValue: 'Evergreen' },
    { date: '21 Mar', eventName: 'Hari Hutan Sedunia (Forest Conservation & Ecology)', category: 'Environment', commercialValue: 'Trending' },
    { date: '22 Mar', eventName: 'Hari Air Sedunia (World Water Day Conservation)', category: 'Environment', commercialValue: 'Trending' },
    { date: 'Late Mar', eventName: 'Startup Pitch & Agile Brainstorming Characters', category: 'Business', commercialValue: 'High Demand' },
  ],
  April: [
    { date: '01 Apr', eventName: "April Fools' Day (Jester & Humor Icons)", category: 'Fun', commercialValue: 'Trending' },
    { date: '07 Apr', eventName: 'Hari Kesehatan Sedunia (Global Healthcare & Doctors)', category: 'Health', commercialValue: 'High Demand' },
    { date: '10 Apr', eventName: 'Hari Raya Idul Fitri (Eid Mubarak Celebration & Mosques)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: '15 Apr', eventName: 'Hari Seni Sedunia (World Art Day & Canvas Tools)', category: 'Creative', commercialValue: 'Evergreen' },
    { date: '22 Apr', eventName: 'Hari Bumi (Earth Day, Clean Energy & Recycling)', category: 'Environment', commercialValue: 'High Demand' },
    { date: '23 Apr', eventName: 'Hari Buku Sedunia (Library & Educational Badges)', category: 'Education', commercialValue: 'Evergreen' },
    { date: 'Late Apr', eventName: 'Paskah & Kelinci Musim Semi (Easter Eggs & Bunny)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: 'Late Apr', eventName: 'Berkebun Rumah (Urban Gardening & Planters)', category: 'Botanical', commercialValue: 'Trending' },
  ],
  Mei: [
    { date: '01 Mei', eventName: 'Hari Buruh Internasional (Labor Day & Workers)', category: 'Social', commercialValue: 'High Demand' },
    { date: '05 Mei', eventName: 'Cinco de Mayo Fiesta (Mexican Sombrero & Maracas)', category: 'Festival', commercialValue: 'Trending' },
    { date: '12 Mei', eventName: "Hari Ibu Internasional (Mother's Day Flowers & Hugs)", category: 'Holiday', commercialValue: 'High Demand' },
    { date: '18 Mei', eventName: 'Hari Museum Internasional (Heritage & Artifacts)', category: 'Culture', commercialValue: 'Evergreen' },
    { date: '23 Mei', eventName: 'Hari Kura-Kura & Satwa Laut (Ocean Marine Life)', category: 'Animals', commercialValue: 'Trending' },
    { date: 'Late Mei', eventName: 'Piknik Musim Panas (Summer Picnic & Outdoor BBQ)', category: 'Food', commercialValue: 'High Demand' },
    { date: 'Late Mei', eventName: 'Koleksi Tropis (Tropical Palm Leaves & Exotic Flora)', category: 'Botanical', commercialValue: 'High Demand' },
    { date: 'Late Mei', eventName: 'Wisuda & Kelulusan Kampus (Graduation Caps & Diploma)', category: 'Education', commercialValue: 'High Demand' },
  ],
  Juni: [
    { date: '01 Jun', eventName: 'Hari Perlindungan Anak Sedunia (Children Happiness)', category: 'Lifestyle', commercialValue: 'Evergreen' },
    { date: '05 Jun', eventName: 'Hari Lingkungan Hidup Sedunia (Zero Waste & Green City)', category: 'Environment', commercialValue: 'High Demand' },
    { date: '08 Jun', eventName: 'Hari Laut Sedunia (Coral Reefs & Underwater Fauna)', category: 'Nature', commercialValue: 'High Demand' },
    { date: '16 Jun', eventName: "Hari Ayah Internasional (Father's Day Mustache & Ties)", category: 'Holiday', commercialValue: 'High Demand' },
    { date: '21 Jun', eventName: 'Solstis Musim Panas (Summer Vacation & Beach Life)', category: 'Seasonal', commercialValue: 'High Demand' },
    { date: '21 Jun', eventName: 'Hari Yoga Internasional (Meditation & Mindfulness)', category: 'Wellness', commercialValue: 'High Demand' },
    { date: 'Late Jun', eventName: 'Festival Musik & Konser Terbuka (Live Music & Bands)', category: 'Entertainment', commercialValue: 'Trending' },
    { date: 'Late Jun', eventName: 'Elemen Es Krim & Mocktail Segar (Summer Drinks)', category: 'Food', commercialValue: 'High Demand' },
  ],
  Juli: [
    { date: '04 Jul', eventName: 'Hari Kemerdekaan Amerika Serikat (4th of July BBQ)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: '07 Jul', eventName: 'Hari Cokelat Sedunia (Chocolate Bars & Bakery)', category: 'Food', commercialValue: 'Trending' },
    { date: '11 Jul', eventName: 'Hari Populasi Sedunia (Global Community & Diversity)', category: 'Social', commercialValue: 'Evergreen' },
    { date: '17 Jul', eventName: 'Hari Emoji Sedunia (Cute Expressive Smiley Badges)', category: 'Icon Set', commercialValue: 'High Demand' },
    { date: '20 Jul', eventName: 'Eksplorasi Antariksa & Bulan (Astronaut & Planets)', category: 'Science', commercialValue: 'High Demand' },
    { date: '30 Jul', eventName: 'Hari Persahabatan Internasional (Friendship Doodles)', category: 'Culture', commercialValue: 'Trending' },
    { date: 'Late Jul', eventName: 'Petualangan Berkemah & Gunung (Camping & Trekking)', category: 'Travel', commercialValue: 'High Demand' },
    { date: 'Late Jul', eventName: 'Diskon Musim Panas (Summer Mid-Season Sale Tags)', category: 'Business', commercialValue: 'High Demand' },
  ],
  Agustus: [
    { date: '08 Agu', eventName: 'Hari Kucing Sedunia (Cute Cats & Feline Paws)', category: 'Animals', commercialValue: 'High Demand' },
    { date: '12 Agu', eventName: 'Hari Gajah Sedunia (Wildlife Conservation Elephants)', category: 'Animals', commercialValue: 'Trending' },
    { date: '17 Agu', eventName: 'HUT Kemerdekaan Republik Indonesia (Merah Putih & Garuda)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: '19 Agu', eventName: 'Hari Fotografi Sedunia (Retro Cameras & Lenses)', category: 'Hobbies', commercialValue: 'Evergreen' },
    { date: '26 Agu', eventName: 'Hari Anjing Sedunia (Dogs Breeds & Pet Care)', category: 'Animals', commercialValue: 'High Demand' },
    { date: 'Late Agu', eventName: 'Back to School (Buku, Ransel, Pensil & Bus Sekolah)', category: 'Education', commercialValue: 'High Demand' },
    { date: 'Late Agu', eventName: 'Musim Panen Pertanian (Autumn Harvest Farm Veggies)', category: 'Food', commercialValue: 'Trending' },
    { date: 'Late Agu', eventName: 'Kopi Spesialti & Kafe (Coffee Beans, Latte & Cup)', category: 'Food', commercialValue: 'Evergreen' },
  ],
  September: [
    { date: '05 Sep', eventName: 'Hari Amal Internasional (Charity & Helping Hands)', category: 'Social', commercialValue: 'Trending' },
    { date: '15 Sep', eventName: 'Oktoberfest Jerman (Pretzels, Beer Mugs & Bavarian)', category: 'Festival', commercialValue: 'High Demand' },
    { date: '16 Sep', eventName: 'Hari Lapisan Ozon (Atmosphere & Eco Clean Tech)', category: 'Environment', commercialValue: 'Trending' },
    { date: '21 Sep', eventName: 'Hari Perdamaian Internasional (Peace Dove & Olive)', category: 'Culture', commercialValue: 'Evergreen' },
    { date: '22 Sep', eventName: 'Equinox Musim Gugur (Autumn Leaves & Pumpkins)', category: 'Seasonal', commercialValue: 'High Demand' },
    { date: '27 Sep', eventName: 'Hari Pariwisata Sedunia (Travel Luggage & Landmarks)', category: 'Travel', commercialValue: 'High Demand' },
    { date: '29 Sep', eventName: 'Hari Jantung Sedunia (Cardiology & Healthy Lifestyle)', category: 'Health', commercialValue: 'Trending' },
    { date: 'Late Sep', eventName: 'Musim Jamur Liar & Hutan (Forest Mushrooms & Moss)', category: 'Botanical', commercialValue: 'High Demand' },
  ],
  Oktober: [
    { date: '01 Okt', eventName: 'Hari Kopi Internasional (Coffee Brewing Flat Icons)', category: 'Food', commercialValue: 'High Demand' },
    { date: '04 Okt', eventName: 'Hari Hewan Sedunia (Animal Welfare & Cute Pets)', category: 'Animals', commercialValue: 'High Demand' },
    { date: '05 Okt', eventName: 'Hari Guru Sedunia (Teachers & Blackboard Badges)', category: 'Education', commercialValue: 'Trending' },
    { date: '10 Okt', eventName: 'Hari Kesehatan Mental (Mental Health Mind Balance)', category: 'Wellness', commercialValue: 'High Demand' },
    { date: '16 Okt', eventName: 'Hari Pangan Sedunia (Bread, Wheat & Food Security)', category: 'Food', commercialValue: 'Evergreen' },
    { date: '31 Okt', eventName: 'Halloween (Spooky Pumpkin, Ghosts, Bats & Haunted)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: 'Late Okt', eventName: 'Cybersecurity Month (Hacking Shield & Data Security)', category: 'Technology', commercialValue: 'High Demand' },
    { date: 'Late Okt', eventName: 'Cozy Autumn Hygge (Sweater, Tea & Warm Blankets)', category: 'Lifestyle', commercialValue: 'High Demand' },
  ],
  November: [
    { date: '01 Nov', eventName: 'Dia de los Muertos (Sugar Skull & Marigold Floral)', category: 'Festival', commercialValue: 'High Demand' },
    { date: '11 Nov', eventName: 'Global Singles Day 11.11 Shopping Mega Sale', category: 'Business', commercialValue: 'High Demand' },
    { date: '14 Nov', eventName: 'Hari Diabetes Sedunia (Health Blood Glucose Icons)', category: 'Health', commercialValue: 'Trending' },
    { date: '20 Nov', eventName: 'Hari Anak Sedunia (Playground, Toys & Joyful Kids)', category: 'Lifestyle', commercialValue: 'Evergreen' },
    { date: 'Fourth Thu', eventName: 'Thanksgiving (Roast Turkey, Autumn Feasts & Corn)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: 'Late Nov', eventName: 'Black Friday & Cyber Monday (Shopping Cart & Badges)', category: 'Business', commercialValue: 'High Demand' },
    { date: 'Late Nov', eventName: 'Kepingan Salju & Es (Snowflakes & Winter Ice Pattern)', category: 'Seasonal', commercialValue: 'High Demand' },
    { date: 'Late Nov', eventName: 'Penyelamatan Hutan Tropis (Rainforest Conservation)', category: 'Environment', commercialValue: 'Trending' },
  ],
  Desember: [
    { date: '01 Des', eventName: 'Hari AIDS Sedunia (Red Ribbon Awareness & Health)', category: 'Health', commercialValue: 'Trending' },
    { date: '05 Des', eventName: 'Hari Tanah Sedunia (Organic Agriculture & Soil)', category: 'Environment', commercialValue: 'Evergreen' },
    { date: '10 Des', eventName: 'Hari Hak Asasi Manusia (Human Rights & Equality)', category: 'Social', commercialValue: 'Evergreen' },
    { date: '11 Des', eventName: 'Hari Gunung Internasional (Mountain Peaks & Nature)', category: 'Nature', commercialValue: 'Evergreen' },
    { date: '12 Des', eventName: 'Harbolnas 12.12 Mega Shopping E-Commerce Banners', category: 'Business', commercialValue: 'High Demand' },
    { date: '21 Des', eventName: 'Solstis Musim Dingin (Winter Wonderland & Pine Tree)', category: 'Seasonal', commercialValue: 'High Demand' },
    { date: '25 Des', eventName: 'Hari Natal (Santa, Reindeer, Ornaments & Bells)', category: 'Holiday', commercialValue: 'High Demand' },
    { date: '31 Des', eventName: 'Malam Tahun Baru (New Year Countdown, Clock & Party)', category: 'Holiday', commercialValue: 'High Demand' },
  ],
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Tracer OmniV2 + 16MP Upscaler',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', style = 'flatcolor' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let imageBase64: string | null = null;
    let mimeType = 'image/png';
    let directSvg: string | null = null;

    // 1. Try Nano Banana high-quality image generation model
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: '1K',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    } catch (err: any) {
      console.warn('Fallback from gemini-3.1-flash-image:', err?.message || err);

      // 2. Try secondary image model
      try {
        const responseLite = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
            },
          },
        });

        const parts = responseLite.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageBase64 = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
            break;
          }
        }
      } catch (liteErr: any) {
        console.warn('Fallback from gemini-3.1-flash-lite-image:', liteErr?.message || liteErr);
      }
    }

    // 3. Resilient Fallback: If image models hit quota (limit: 0 on free tier),
    // activate Omni Vector Synthesizer via gemini-3.1-flash-lite to generate complete, clean, scalable SVG vector!
    if (!imageBase64) {
      console.log('Activating Omni Vector Synthesizer for:', prompt);
      const vectorSysPrompt = `You are OMNI Vector AI, an elite Microstock Vector Designer. Generate a complete, production-grade, highly polished, valid SVG vector illustration for the prompt: "${prompt}".
Style requirements:
- Visual style: ${style} (e.g. flat color, minimalist line art, silhouette, duotone, isometric, etc.).
- Clean distinct vector shapes and paths with solid fills, crisp curves, and zero blurry gradients.
- Isolated object on clean transparent background.
- Standard viewBox="0 0 1000 1000", width="100%", height="100%", xmlns="http://www.w3.org/2000/svg".
- Output ONLY the raw valid <svg>...</svg> XML markup. Do NOT wrap in markdown code blocks (\`\`\`xml or \`\`\`), no explanations, no text before or after.`;

      const svgRes = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Create SVG vector illustration for: ${prompt}`,
        config: {
          systemInstruction: vectorSysPrompt,
        },
      });

      let rawText = svgRes.text || '';
      rawText = rawText.replace(/```xml/gi, '').replace(/```svg/gi, '').replace(/```/g, '').trim();

      const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
      if (svgMatch) {
        directSvg = svgMatch[0];
      } else {
        throw new Error('Gagal menghasilkan vector SVG.');
      }
    }

    return res.json({
      imageBase64,
      directSvg,
      mimeType,
      method: directSvg ? 'direct-vector' : 'raster-tracer',
    });
  } catch (error: any) {
    console.error('Error generating image/vector:', error);
    return res.status(500).json({ error: error.message || 'Gagal memproses gambar.' });
  }
});

app.post('/api/trend-events', async (req, res) => {
  const { month } = req.body;
  const targetMonth = month || 'Januari';

  try {
    const sysPrompt = `You are OMNI Vector AI, an expert Microstock Contributor. List EXACTLY 8 major global seasonal events, holidays, commercial festivals, or high-converting vector themes that occur in the month of ${targetMonth}. Focus on themes that sell exceptionally well as vectors, flat icons, or silhouette graphics on Adobe Stock, Shutterstock, and Freepik. Output in strict JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `List 8 top selling microstock vector themes and seasonal events for ${targetMonth}.`,
      config: {
        systemInstruction: sysPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: 'Format: DD MMM or Early/Mid/Late' },
              eventName: { type: Type.STRING, description: 'Event title' },
              category: { type: Type.STRING, description: 'Design category, e.g. Icon Set, Pattern, Holiday, Floral' },
              commercialValue: { type: Type.STRING, description: 'Trending, Evergreen, or High Demand' }
            },
            required: ['date', 'eventName']
          }
        }
      }
    });

    const text = response.text || '[]';
    const events = JSON.parse(text);
    if (Array.isArray(events) && events.length > 0) {
      return res.json({ events });
    }
  } catch (err: any) {
    console.warn(`Falling back to curated database for ${targetMonth} due to:`, err.message);
  }

  // Graceful zero-latency fallback to curated events database
  const fallbackEvents = CURATED_MONTHLY_EVENTS[targetMonth] || CURATED_MONTHLY_EVENTS['Januari'];
  return res.json({ events: fallbackEvents });
});

app.post('/api/extract-prompts', async (req, res) => {
  const { eventName } = req.body;
  if (!eventName) {
    return res.status(400).json({ error: 'Event name is required' });
  }

  try {
    const sysPrompt = `You are OMNI Vector AI, an elite Microstock Vector Designer. Generate EXACTLY 5 distinct, commercially viable microstock prompts for generating clean vector asset elements related to '${eventName}'. The styles MUST focus on either 'Minimalist Line Art' (black outlines only, clean, uncolored, coloring style, isolated on white background) or 'Flat Color Vector' (solid flat colors, sharp distinct color blocks, no gradients, isolated on white background). Output strictly as a JSON array of 5 strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Generate 5 microstock vector design prompts for: ${eventName}`,
      config: {
        systemInstruction: sysPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text || '[]';
    const prompts = JSON.parse(text);
    if (Array.isArray(prompts) && prompts.length > 0) {
      return res.json({ prompts });
    }
  } catch (err: any) {
    console.warn(`Prompt extraction fallback for '${eventName}' due to:`, err.message);
  }

  // Graceful rule-based prompts fallback
  const cleanName = eventName.replace(/\(.*?\)/g, '').trim();
  const fallbackPrompts = [
    `Set of minimalist line art icons for ${cleanName}, clean black contour glyphs, isolated white background`,
    `Flat color vector illustration element of ${cleanName}, modern solid vibrant color blocks, zero gradients`,
    `Decorative botanical and floral frame surrounding ${cleanName}, flat 2D vector design, isolated`,
    `Minimalist monochrome silhouette badge representing ${cleanName}, sharp geometric vector contours`,
    `Modern corporate flat vector character with elements of ${cleanName}, clean isometric perspective, isolated`,
  ];
  return res.json({ prompts: fallbackPrompts });
});

app.post('/api/generate-metadata', async (req, res) => {
  const { prompt, style = 'flatcolor' } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const sysPrompt = `You are an elite Microstock Metadata Specialist for Adobe Stock, Shutterstock, and Freepik. 
Generate:
1. title: A concise, highly searchable, grammatically correct title (5 to 10 words, describing the vector elements, style, and isolated background).
2. keywords: EXACTLY 50 highly relevant comma-separated tags/keywords (no duplicates, lowercase, including synonyms, design terms, and use cases).
3. categoryId: The most fitting Adobe Stock Category ID as integer (1: Animals, 2: Buildings/Architecture, 3: Business, 4: Drinks, 5: Environment, 6: States of Mind, 7: Food, 8: Graphic Resources, 9: Hobbies/Leisure, 10: Industry, 11: Landscapes, 12: Lifestyle, 13: People, 14: Plants/Flowers, 15: Culture/Religion, 16: Science, 17: Social Issues, 18: Sports, 19: Technology, 20: Transport, 21: Travel).
4. categoryName: The name of the Adobe Stock category.
Output strictly as JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Artwork prompt: "${prompt}". Style: "${style}". Generate Adobe Stock compliant metadata.`,
      config: {
        systemInstruction: sysPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            keywords: { type: Type.STRING },
            categoryId: { type: Type.INTEGER },
            categoryName: { type: Type.STRING }
          },
          required: ['title', 'keywords', 'categoryId']
        }
      }
    });

    const text = response.text || '{}';
    const metadata = JSON.parse(text);
    if (metadata.title && metadata.keywords) {
      return res.json(metadata);
    }
  } catch (err: any) {
    console.warn('Metadata fallback due to:', err.message);
  }

  // Graceful rule-based SEO metadata generator
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w: string) => w.length > 2);

  const baseKeywords = [
    ...words,
    'vector', 'illustration', 'graphic', 'isolated', 'white background',
    'element', 'design', 'flat', 'clipart', 'icon', 'symbol', 'modern',
    'collection', 'clean', 'artboard', 'stock vector', 'decorative',
    'minimalist', 'contour', 'shape', 'digital art', 'creative', 'concept',
    'template', 'print', 'web design', 'eps', 'svg', 'microstock', 'adobe stock',
    'asset', 'drawing', 'style', 'high quality', 'simple', 'outline', 'nature',
    'sign', 'banner', 'badge', 'logo element', 'silhouette', 'flat art',
    'vector set', 'graphics', 'visual', 'commercial', 'royalty free', 'editorial'
  ];

  const uniqueKw = Array.from(new Set(baseKeywords)).slice(0, 50).join(', ');

  const titleWords = words.slice(0, 5).join(' ');
  const title = `${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)} Flat Vector Illustration Isolated on White Background`;

  return res.json({
    title,
    keywords: uniqueKw,
    categoryId: 8,
    categoryName: 'Graphic Resources'
  });
});

async function startServer() {
  const PORT = process.env.PORT || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`FIZAVectogen Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
