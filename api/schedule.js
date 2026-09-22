// api/schedule.js
const { Client } = require('@notionhq/client');

export default async function handler(req, res) {
  // 1. GitHub Pages(shinbaekhyun2026.github.io) 도메인 접근 허용 (CORS 해결)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 브라우저 사전 요청(Preflight) 대응
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
          { time: "안내", text: "Vercel 환경 변수(NOTION_API_KEY, NOTION_DATABASE_ID)를 확인해 주세요." }
        ]
      });
    }

    const notion = new Client({ auth: notionApiKey });

    // 오늘 날짜 구하기 (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    const response = await notion.databases.query({
      database_id: databaseId,
    });

    const schedules = response.results.map((page) => {
      const props = page.properties;
      
      // 속성명 대응 (일정명 / Name / Title / 제목)
      const titleObj = props['일정명'] || props['Name'] || props['Title'] || props['제목'];
      let title = '제목 없음';
      if (titleObj && titleObj.title && titleObj.title.length > 0) {
        title = titleObj.title[0].plain_text;
      }

      // 날짜 속성 대응 (날짜 / Date)
      const dateObj = props['날짜'] || props['Date'];
      let date = '학사일정';
      if (dateObj && dateObj.date && dateObj.date.start) {
        date = dateObj.date.start;
      }

      return {
        time: date,
        text: title
      };
    });

    return res.status(200).json({ schedules });

  } catch (error) {
    console.error("Notion Fetch Error:", error);
    return res.status(200).json({
      schedules: [
        { time: "알림", text: "오늘 등록된 주요 학사일정이 없습니다." }
      ]
    });
  }
}
