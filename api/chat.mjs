import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SLOTS = {
  Monday:    ['10:00', '11:30', '14:00', '15:30'],
  Tuesday:   ['09:30', '11:00', '13:00', '16:00'],
  Wednesday: ['10:00', '12:00', '14:30'],
  Thursday:  ['09:00', '11:00', '14:00', '15:00'],
  Friday:    ['10:00', '11:30', '13:30'],
  Saturday:  ['09:00', '10:30', '12:00', '14:00', '15:30'],
  Sunday:    [],
};

const booked = [];

const tools = [
  {
    name: 'check_availability',
    description: 'Check available appointment slots for a given day',
    input_schema: {
      type: 'object',
      properties: {
        day: { type: 'string', description: 'Day of the week, e.g. Saturday' },
      },
      required: ['day'],
    },
  },
  {
    name: 'create_booking',
    description: 'Book an appointment for a customer',
    input_schema: {
      type: 'object',
      properties: {
        day:     { type: 'string' },
        time:    { type: 'string' },
        name:    { type: 'string' },
        service: { type: 'string' },
      },
      required: ['day', 'time', 'name', 'service'],
    },
  },
];

function handleTool(name, input) {
  if (name === 'check_availability') {
    const day = Object.keys(SLOTS).find(d => d.toLowerCase() === input.day.toLowerCase());
    if (!day) return { error: 'We are not open that day.' };
    const available = SLOTS[day].filter(t => !booked.find(b => b.day === day && b.time === t));
    return available.length ? { day, slots: available } : { day, slots: [], message: 'Fully booked that day.' };
  }
  if (name === 'create_booking') {
    booked.push(input);
    return { confirmed: true, reference: `BK${Date.now().toString().slice(-5)}` };
  }
}

const system = `You are Aria, the friendly booking assistant for Bella's Hair Studio in Colchester, Essex.
Services: Cut & Blow Dry (£45), Colour & Cut (£85), Highlights (£95), Blow Dry (£25), Kids Cut (£20).
Hours: Mon–Sat, varies by day. Closed Sunday.
Always be warm, brief, and helpful. When booking, always confirm the service, day, time, and customer name before calling create_booking.

You have already greeted the user with: "Hi! I'm Aria, the booking assistant for Bella's Hair Studio. How can I help you today?". Do not reintroduce yourself or repeat the greeting. Respond directly to what the user is asking. If they only say something like "hi", reply with a short prompt such as "What can I help you with today?" rather than greeting them again.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;

  let response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system,
    tools,
    messages,
  });

  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter(b => b.type === 'tool_use');
    const toolResults = toolUses.map(tu => ({
      type: 'tool_result',
      tool_use_id: tu.id,
      content: JSON.stringify(handleTool(tu.name, tu.input)),
    }));

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      tools,
      messages,
    });
  }

  const text = response.content.find(b => b.type === 'text')?.text ?? '';
  res.json({ reply: text });
}
