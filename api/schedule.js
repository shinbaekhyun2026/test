const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstDate = new Date(now.getTime() + kstOffset);
        const today = kstDate.toISOString().split('T')[0];

        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: '날짜',
                date: {
                    equals: today
                }
            }
        });

        const schedules = response.results.map(page => {
            const title = page.properties['이름']?.title[0]?.plain_text || '일정';
            const time = page.properties['시간']?.rich_text[0]?.plain_text || '종일';
            return { time, text: title };
        });

        return res.status(200).json({ success: true, date: today, schedules });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
