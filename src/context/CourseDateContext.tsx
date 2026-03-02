import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CourseDate } from '../types';

const STORAGE_KEY = 'courseDates';

const defaultDates: CourseDate[] = [
  {
    id: '1',
    date: '2026年3月29日（日）',
    time: '10:00',
    venue: '宮前市民館',
    isActive: true,
  },
];

type CourseDateContextType = {
  courseDates: CourseDate[];
  addCourseDate: (date: Omit<CourseDate, 'id'>) => void;
  updateCourseDate: (id: string, date: Partial<CourseDate>) => void;
  deleteCourseDate: (id: string) => void;
  getActiveDates: () => CourseDate[];
};

const CourseDateContext = createContext<CourseDateContextType | undefined>(undefined);

export function CourseDateProvider({ children }: { children: ReactNode }) {
  const [courseDates, setCourseDates] = useState<CourseDate[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultDates;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courseDates));
  }, [courseDates]);

  const addCourseDate = (date: Omit<CourseDate, 'id'>) => {
    const newDate: CourseDate = {
      ...date,
      id: Date.now().toString(),
    };
    setCourseDates(prev => [...prev, newDate]);
  };

  const updateCourseDate = (id: string, updates: Partial<CourseDate>) => {
    setCourseDates(prev =>
      prev.map(date => (date.id === id ? { ...date, ...updates } : date))
    );
  };

  const deleteCourseDate = (id: string) => {
    setCourseDates(prev => prev.filter(date => date.id !== id));
  };

  const getActiveDates = () => {
    return courseDates.filter(date => date.isActive);
  };

  return (
    <CourseDateContext.Provider
      value={{ courseDates, addCourseDate, updateCourseDate, deleteCourseDate, getActiveDates }}
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
