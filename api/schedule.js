export default async function handler(req, res) {
  // 1. CORS 헤더 설정 (모든 도메인 허용 또는 특정 도메인 허용)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // 특정 도메인만 허용하려면 'https://shinbaekhyun2026.github.io' 입력
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. 브라우저의 OPTIONS Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. 기존 노션 API 호출 로직 실행
  try {
    // ... 기존 Notion API 불러오기 코드 ...
    
    // 예시 응답
    return res.status(200).json({
      success: true,
      schedules: [
        /* 데이터 */
      ]
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
