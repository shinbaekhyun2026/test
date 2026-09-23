module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  // 신백현 오늘의 일정 DB ID 고정 설정
  const NOTION_DATABASE_ID = "3d8930617c3f8065b488000cf850929e";

  if (!NOTION_API_KEY) {
    return res.status(200).json({ 
      schedules: [{ time: "오류", text: "NOTION_API_KEY가 없습니다." }] 
    });
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_size: 100 })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({ 
        schedules: [{ time: `Notion 에러(${response.status})`, text: errorText }] 
      });
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
      return res.status(200).json({
        schedules: [{ time: "안내", text: "오늘 등록된 일정이 없습니다." }]
      });
    }

    const schedules = [];

    for (const page of results) {
      const props = page.properties;
      let titleText = "";
      let dateStr = "";

      for (const key in props) {
        const prop = props[key];
        if (prop.type === 'title' && prop.title && prop.title.length > 0) {
          titleText = prop.title.map(t => t.plain_text).join('');
        }
        if (prop.type === 'date' && prop.date && prop.date.start) {
          dateStr = prop.date.start;
        }
      }

      if (!titleText) {
        for (const key in props) {
          const prop = props[key];
          if (prop.type === 'rich_text' && prop.rich_text && prop.rich_text.length > 0) {
            titleText = prop.rich_text.map(t => t.plain_text).join('');
            break;
          }
        }
      }

      if (titleText) {
        schedules.push({
          time: dateStr || "오늘의 일정",
          text: titleText
        });
      }
    }

    return res.status(200).json({ schedules });
  } catch (error) {
    return res.status(200).json({ 
      schedules: [{ time: "서버 에러", text: error.message }] 
    });
  }
};
