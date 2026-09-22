export default async function handler(req, res) {
  // 1. 모든 Origin에 대해 CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. 브라우저의 OPTIONS (Preflight) 사전 요청 즉시 승인 (가장 중요!)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 실제 학사일정 불러오기 (Notion API 연동)
  try {
    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

    // 환경변수 체크
    if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
      return res.status(500).json({
        success: false,
        message: "Vercel 환경변수(NOTION_API_KEY 또는 NOTION_DATABASE_ID)가 설정되지 않았습니다."
      });
    }

    // 오늘 날짜 계산 (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // Notion API Query 호출
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: '날짜', // 노션 데이터베이스의 날짜 속성명 (필요 시 수정)
          date: {
            equals: today
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    // 노션 데이터 가공 (속성명 구조에 맞춰 추출)
    const schedules = data.results.map(page => {
      const titleProperty = page.properties['일정명'] || page.properties['Title'] || page.properties['Name'];
      const title = titleProperty?.title?.[0]?.plain_text || '내용 없음';
      return {
        time: '오늘',
        text: title
      };
    });

    return res.status(200).json({
      success: true,
      schedules: schedules
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
