import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CourseDate } from '../types';

const API_URL = '/api/courses';

type CourseDateContextType = {
  courseDates: CourseDate[];
  isLoading: boolean;
  error: string | null;
  addCourseDate: (date: Omit<CourseDate, 'id'>) => Promise<void>;
  updateCourseDate: (id: string, date: Partial<CourseDate>) => Promise<void>;
  deleteCourseDate: (id: string) => Promise<void>;
  getActiveDates: () => CourseDate[];
  refreshCourses: () => Promise<void>;
};

const CourseDateContext = createContext<CourseDateContextType | undefined>(undefined);

export function CourseDateProvider({ children }: { children: ReactNode }) {
  const [courseDates, setCourseDates] = useState<CourseDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourseDates(data);
    } catch (err) {
      setError('講座データの取得に失敗しました');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const addCourseDate = async (date: Omit<CourseDate, 'id'>) => {
    try {
      setError(null);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(date),
      });
      if (!response.ok) throw new Error('Failed to add course');
      const newCourse = await response.json();
      setCourseDates(prev => [...prev, newCourse]);
    } catch (err) {
      setError('講座の追加に失敗しました');
      console.error('Add error:', err);
      throw err;
    }
  };

  const updateCourseDate = async (id: string, updates: Partial<CourseDate>) => {
    try {
      setError(null);
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) throw new Error('Failed to update course');
      const updatedCourse = await response.json();
      setCourseDates(prev =>
        prev.map(date => (date.id === id ? updatedCourse : date))
      );
    } catch (err) {
      setError('講座の更新に失敗しました');
      console.error('Update error:', err);
      throw err;
    }
  };

  const deleteCourseDate = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Failed to delete course');
      setCourseDates(prev => prev.filter(date => date.id !== id));
    } catch (err) {
      setError('講座の削除に失敗しました');
      console.error('Delete error:', err);
      throw err;
    }
  };

  const getActiveDates = () => {
    return courseDates.filter(date => date.isActive);
  };

  const refreshCourses = async () => {
    await fetchCourses();
  };

  return (
    <CourseDateContext.Provider
      value={{
        courseDates,
        isLoading,
        error,
        addCourseDate,
        updateCourseDate,
        deleteCourseDate,
        getActiveDates,
        refreshCourses,
      }}
    >
      {children}
    </CourseDateContext.Provider>
  );
}

export function useCourseDates() {
  const context = useContext(CourseDateContext);
  if (!context) {
    throw new Error('useCourseDates must be used within a CourseDateProvider');
  }
  return context;
}
