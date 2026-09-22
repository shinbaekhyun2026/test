const { Client } = require('@notionhq/client');

export default async function handler(req, res) {
  // CORS 차단 방지 헤더 설정
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

  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return res.status(200).json({
        schedules: [
          { time: "알림", text: "Vercel 환경 변수(NOTION_API_KEY, NOTION_DATABASE_ID)를 설정해 주세요." }
        ]
      });
    }

    const notion = new Client({ auth: notionApiKey });
    const response = await notion.databases.query({ database_id: databaseId });

    const schedules = response.results.map((page) => {
      const props = page.properties;
      
      const titleObj = props['일정명'] || props['Name'] || props['Title'] || props['제목'];
      let title = '내용 없음';
      if (titleObj && titleObj.title && titleObj.title.length > 0) {
        title = titleObj.title[0].plain_text;
      }

      const dateObj = props['날짜'] || props['Date'];
      let date = '학사일정';
      if (dateObj && dateObj.date && dateObj.date.start) {
        date = dateObj.date.start;
      }

      return { time: date, text: title };
    });

    return res.status(200).json({ schedules });

  } catch (error) {
    console.error("Notion API Error:", error);
    return res.status(200).json({
      schedules: [
        { time: "학사일정", text: "오늘 등록된 주요 학사일정이 없습니다." }
      ]
    });
  }
}
