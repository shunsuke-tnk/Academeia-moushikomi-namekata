import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const COURSES_KEY = 'courses';

type CourseDate = {
  id: string;
  date: string;
  time: string;
  venue: string;
  isActive: boolean;
};

const defaultCourses: CourseDate[] = [
  {
    id: '1',
    date: '2026年3月29日（日）',
    time: '10:00',
    venue: '宮前市民館',
    isActive: true,
  },
];

async function getCourses(): Promise<CourseDate[]> {
  const courses = await redis.get<CourseDate[]>(COURSES_KEY);
  if (!courses) {
    await redis.set(COURSES_KEY, defaultCourses);
    return defaultCourses;
  }
  return courses;
}

async function saveCourses(courses: CourseDate[]): Promise<void> {
  await redis.set(COURSES_KEY, courses);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const courses = await getCourses();
      return res.status(200).json(courses);
    }

    if (req.method === 'POST') {
      const courses = await getCourses();
      const newCourse: CourseDate = {
        ...req.body,
        id: Date.now().toString(),
      };
      courses.push(newCourse);
      await saveCourses(courses);
      return res.status(201).json(newCourse);
    }

    if (req.method === 'PUT') {
      const courses = await getCourses();
      const { id, ...updates } = req.body;
      const index = courses.findIndex(c => c.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Course not found' });
      }
      courses[index] = { ...courses[index], ...updates };
      await saveCourses(courses);
      return res.status(200).json(courses[index]);
    }

    if (req.method === 'DELETE') {
      const courses = await getCourses();
      const { id } = req.body;
      const filtered = courses.filter(c => c.id !== id);
      await saveCourses(filtered);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
