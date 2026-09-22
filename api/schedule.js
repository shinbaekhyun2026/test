// api/schedule.js
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export default async function handler(req, res) {
  // CORS 및 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!databaseId || !process.env.NOTION_API_KEY) {
      return res.status(500).json({ error: "환경변수(API KEY 또는 DATABASE ID)가 설정되지 않았습니다." });
    }

    const response = await notion.databases.query({
      database_id: databaseId,
    });

    // 노션 DB에서 제목/일정 데이터를 추출 (노션 DB 속성명에 맞게 조정)
    const schedules = response.results.map((page) => {
      const props = page.properties;
      
      // '일정명' 또는 'Name' 또는 'Title' 등 노션 DB 열 이름에 맞게 선택
      const titleObj = props['일정명'] || props['Name'] || props['Title'] || props['제목'];
      const title = titleObj?.title[0]?.plain_text || '내용 없음';

      // '날짜' 또는 'Date' 열 선택
      const dateObj = props['날짜'] || props['Date'];
      const date = dateObj?.date?.start || '학사일정';

      return {
        time: date,
        text: title
      };
    });

    return res.status(200).json({ schedules });
  } catch (error) {
    console.error("Notion Fetch Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
