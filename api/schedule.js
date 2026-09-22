import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const databaseId = process.env.NOTION_DATABASE_ID;
    
    if (!databaseId) {
      return res.status(200).json({ schedules: [] });
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 10,
    });

    const schedules = response.results.map((page) => {
      const title = page.properties['일정명']?.title[0]?.plain_text || 
                    page.properties['Name']?.title[0]?.plain_text || '학사일정';
      const time = page.properties['시간']?.rich_text[0]?.plain_text || '안내';
      return { text: title, time: time };
    });

    return res.status(200).json({ schedules });
  } catch (error) {
    console.error("Notion Fetch Error:", error);
    // 에러 발생 시 빈 배열 전달하여 프론트엔드 오류 방지
    return res.status(200).json({ schedules: [] });
  }
}
