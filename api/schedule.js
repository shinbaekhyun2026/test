module.exports = async (req, res) => {
  // CORS 헤더 설정
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
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return res.status(200).json({ 
      schedules: [], 
      message: "환경변수(NOTION_API_KEY 또는 NOTION_DATABASE_ID)가 설정되지 않았습니다." 
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
      console.error("Notion API Error:", errorText);
      return res.status(200).json({ schedules: [], error: errorText });
    }

    const data = await response.json();
    const results = data.results || [];

    // 오늘 날짜 구하기 (YYYY-MM-DD)
    const now = new Date();
    const kstOffset = 9 * 60; // KST는 UTC+9
    const localTime = new Date(now.getTime() + (now.getTimezoneOffset() + kstOffset) * 60000);
    const todayStr = localTime.toISOString().split('T')[0];

    const schedules = [];

    for (const page of results) {
      const props = page.properties;
      let titleText = "";
      let dateStr = "";

      // 모든 속성을 순회하며 제목(title)과 날짜(date) 자동 추출
      for (const key in props) {
        const prop = props[key];

        // Title(제목) 속성 추출
        if (prop.type === 'title' && prop.title && prop.title.length > 0) {
          titleText = prop.title.map(t => t.plain_text).join('');
        }

        // Date(날짜) 속성 추출
        if (prop.type === 'date' && prop.date && prop.date.start) {
          dateStr = prop.date.start;
        }
      }

      // 만약 Title 타입을 찾지 못했다면 rich_text 속성에서 추출 시도
      if (!titleText) {
        for (const key in props) {
          const prop = props[key];
          if (prop.type === 'rich_text' && prop.rich_text && prop.rich_text.length > 0) {
            titleText = prop.rich_text.map(t => t.plain_text).join('');
            break;
          }
        }
      }

      // 제목이 존재하는 경우 리스트에 추가
      if (titleText) {
        // 날짜 필드가 비어있거나 오늘 날짜와 일치하거나, 전체 항목을 표시
        schedules.push({
          time: dateStr || "오늘의 일정",
          text: titleText,
          date: dateStr
        });
      }
    }

    return res.status(200).json({ schedules });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(200).json({ schedules: [], error: error.message });
  }
};
