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
  const NOTION_DATABASE_ID = "3d8930617c3f80399197cea8e06b1a7b";

  if (!NOTION_API_KEY) {
    return res.status(200).json({ 
      schedules: [{ time: "오류", text: "NOTION_API_KEY가 설정되지 않았습니다." }] 
    });
  }

  try {
    // 한국 시간(KST) YYYY-MM-DD 추출
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstDate = new Date(utc + (9 * 60 * 60 * 1000));
    
    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`; // 예: "2026-09-23"

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
        schedules: [{ time: `Notion API 에러(${response.status})`, text: errorText }] 
      });
    }

    const data = await response.json();
    const results = data.results || [];

    const schedules = [];

    for (const page of results) {
      const props = page.properties;
      let titleText = "";
      let dateStart = "";

      for (const key in props) {
        const prop = props[key];
        // 제목
        if (prop.type === 'title' && prop.title && prop.title.length > 0) {
          titleText = prop.title.map(t => t.plain_text).join('');
        }
        // 날짜 (YYYY-MM-DD 만 추출)
        if (prop.type === 'date' && prop.date && prop.date.start) {
          dateStart = prop.date.start.substring(0, 10);
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

      // 오직 오늘 날짜(todayStr)와 완벽히 일치하는 데이터만 담기
      if (titleText && dateStart === todayStr) {
        schedules.push({
          time: `${month}/${day}`,
          text: titleText
        });
      }
    }

    if (schedules.length === 0) {
      return res.status(200).json({
        schedules: [{ time: `${month}/${day}`, text: "오늘 등록된 주요 학사일정이 없습니다." }]
      });
    }

    return res.status(200).json({ schedules });
  } catch (error) {
    return res.status(200).json({ 
      schedules: [{ time: "서버 에러", text: error.message }] 
    });
  }
};
