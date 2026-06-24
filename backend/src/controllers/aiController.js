/**
 * AI Assistant Controller — Manages life planner system prompts and proxies chat requests to Groq/OpenRouter.
 */

const SYSTEM_PROMPT = `You are a Personal AI Assistant for Nikhil.
You help him manage his life, specifically his food plans, notes, reminders, and tasks.
Your replies must be brief, friendly, highly personal, and focused. Do not give generic, randomized, or long-winded answers.

If the user asks you to:
1. Add or schedule food in their food plan/meals.
2. Save a note.
3. Add a reminder.
4. Add a task.

You MUST append the actions to the very end of your response inside a <actions>[...]</actions> block. The block must contain a valid JSON array of actions.

Action Schema Definitions:
1. Add/update food:
   {"type": "add_food", "day": "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday", "meal": "breakfast"|"lunch"|"dinner", "food": "Description of the meal"}
2. Save a note:
   {"type": "save_note", "title": "Note Title", "content": "Note Content"}
3. Add a reminder:
   {"type": "add_reminder", "title": "Reminder Title", "dueAt": "ISOString representation of date/time in YYYY-MM-DDTHH:mm:ss.sssZ format", "note": "Optional details"}
4. Add a task:
   {"type": "add_task", "title": "Task Title", "description": "Optional details", "priority": "low"|"medium"|"high"}

Example response:
I've scheduled a reminder to buy groceries at 6:00 PM and added oats to your Monday Breakfast!
<actions>
[
  {"type": "add_reminder", "title": "Buy groceries", "dueAt": "2026-06-24T18:00:00.000Z"},
  {"type": "add_food", "day": "Monday", "meal": "breakfast", "food": "Oats with honey"}
]
</actions>

Rules:
- Make sure the JSON in <actions> is perfectly valid and follows the schema exactly.
- Always output relative dates and times based on the current local time: 2026-06-24.
`;

async function handleChat(req, res) {
  try {
    const { messages = [] } = req.body;

    const payloadMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    let aiReply = '';
    let success = false;

    // 1. Try Groq API
    if (process.env.GROQ_API_KEY) {
      try {
        console.log('🤖 Contacting Groq API...');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: payloadMessages,
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiReply = data.choices?.[0]?.message?.content || '';
          success = true;
          console.log('🤖 Groq response success.');
        } else {
          const errText = await response.text();
          console.warn('⚠️ Groq API responded with error:', errText);
        }
      } catch (err) {
        console.error('❌ Failed to call Groq API:', err.message);
      }
    }

    // 2. Fallback to OpenRouter
    if (!success && process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('sk-or-...')) {
      try {
        console.log('🤖 Groq failed/missing. Contacting OpenRouter API...');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3-8b-instruct:free',
            messages: payloadMessages,
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiReply = data.choices?.[0]?.message?.content || '';
          success = true;
          console.log('🤖 OpenRouter response success.');
        } else {
          const errText = await response.text();
          console.warn('⚠️ OpenRouter API responded with error:', errText);
        }
      } catch (err) {
        console.error('❌ Failed to call OpenRouter API:', err.message);
      }
    }

    // 3. Fallback to local mockup responses if no API keys are available
    if (!success) {
      console.warn('⚠️ No active AI credentials available. Serving local mockup response...');
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      
      if (lastUserMsg.toLowerCase().includes('food') || lastUserMsg.toLowerCase().includes('breakfast') || lastUserMsg.toLowerCase().includes('lunch') || lastUserMsg.toLowerCase().includes('dinner')) {
        aiReply = `Hi Nikhil! I've automatically added that meal to your food plan.
<actions>
[
  {"type": "add_food", "day": "Monday", "meal": "breakfast", "food": "High protein scramble"}
]
</actions>`;
      } else if (lastUserMsg.toLowerCase().includes('note')) {
        aiReply = `I've saved a new note in your ledger.
<actions>
[
  {"type": "save_note", "title": "AI Assistant Note", "content": "Saved notes via local offline fallback."}
]
</actions>`;
      } else if (lastUserMsg.toLowerCase().includes('reminder')) {
        aiReply = `Sure! I have scheduled a reminder for you.
<actions>
[
  {"type": "add_reminder", "title": "Offline Reminder", "dueAt": "2026-06-25T18:00:00.000Z", "note": "Created offline"}
]
</actions>`;
      } else if (lastUserMsg.toLowerCase().includes('task')) {
        aiReply = `I have added a new task to your checklist.
<actions>
[
  {"type": "add_task", "title": "Check kitchen items", "description": "Verify grocery stock", "priority": "medium"}
]
</actions>`;
      } else {
        aiReply = `Hello Nikhil! I am your Personal AI Assistant. I can help you save notes, add tasks, schedule reminders, and update your weekly meal plans. Try asking me "Add task buy groceries" or "Put oats in Monday breakfast"!`;
      }
    }

    res.json({ reply: aiReply });
  } catch (err) {
    console.error('AI chat endpoint error:', err);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
}

module.exports = { handleChat };
