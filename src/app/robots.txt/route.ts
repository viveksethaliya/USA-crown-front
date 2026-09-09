import { generateRobotsText } from '@/utils/robotsGenerator';

export const revalidate = 60;

export async function GET() {
  const text = await generateRobotsText();

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
