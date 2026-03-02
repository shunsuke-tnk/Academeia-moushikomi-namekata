import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Calendar, Clock, MapPin, ToggleLeft, ToggleRight, Loader2, RefreshCw } from 'lucide-react';
import { useCourseDates } from '../context/CourseDateContext';
import { CourseDate } from '../types';

// 15分刻みの時間オプションを生成
const timeOptions: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

// 日付をYYYY年M月D日（曜日）形式に変換
const formatDateToJapanese = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  return `${year}年${month}月${day}日（${dayOfWeek}）`;
};

// 日本語日付をYYYY-MM-DD形式に変換（カレンダー用）
const parseJapaneseDateToISO = (japaneseDate: string): string => {
  const match = japaneseDate.match(/(\d+)年(\d+)月(\d+)日/);
  if (!match) return '';
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export default function Admin() {
  const { courseDates, isLoading, error, addCourseDate, updateCourseDate, deleteCourseDate, refreshCourses } = useCourseDates();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ date: '', time: '10:00', venue: '', isActive: true });
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setFormData({ date: '', time: '10:00', venue: '', isActive: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    const japaneseDate = formatDateToJapanese(isoDate);
    setFormData({ ...formData, date: japaneseDate });
  };

  const handleAdd = async () => {
    if (!formData.date || !formData.time || !formData.venue) return;
    setIsSaving(true);
    try {
      await addCourseDate(formData);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (course: CourseDate) => {
    setEditingId(course.id);
    setFormData({
      date: course.date,
      time: course.time,
      venue: course.venue,
      isActive: course.isActive,
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.date || !formData.time || !formData.venue) return;
    setIsSaving(true);
    try {
      await updateCourseDate(editingId, formData);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('この講座日程を削除しますか？')) {
      await deleteCourseDate(id);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    await updateCourseDate(id, { isActive: !currentState });
  };

  const formatDisplayDate = (course: CourseDate) => {
    return `${course.date} ${course.time}【${course.venue}】`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">講座日程 管理コンソール</h1>
              <p className="text-gray-500 text-sm">申込フォームに表示される講座日程を管理します</p>
            </div>
            <button
              onClick={() => refreshCourses()}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="再読み込み"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 mb-6">
            {error}
          </div>
        )}

        {/* Add Button */}
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={isSaving}
            className="w-full mb-6 py-4 px-6 bg-gray-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            <Plus size={20} />
            新しい講座日程を追加
          </button>
        )}

        {/* Add Form */}
        {isAdding && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">新規追加</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  日付
                </label>
                <input
                  type="date"
                  value={parseJapaneseDateToISO(formData.date)}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
                {formData.date && (
                  <p className="text-xs text-gray-500 mt-1">{formData.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={14} className="inline mr-1" />
                  時間
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={14} className="inline mr-1" />
                  会場
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="宮前市民館"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium flex items-center gap-1 hover:bg-gray-800"
              >
                <Check size={16} />
                追加
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center gap-1 hover:bg-gray-200"
              >
                <X size={16} />
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* Course List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">登録済み講座日程</h2>
          </div>

          {courseDates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              登録されている講座日程はありません
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {courseDates.map((course) => (
                <li key={course.id} className="p-4 hover:bg-gray-50">
                  {editingId === course.id ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                          <input
                            type="date"
                            value={parseJapaneseDateToISO(formData.date)}
                            onChange={handleDateChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                          />
                          {formData.date && (
                            <p className="text-xs text-gray-500 mt-1">{formData.date}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">時間</label>
                          <select
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">会場</label>
                          <input
                            type="text"
                            value={formData.venue}
                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleUpdate}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium flex items-center gap-1 hover:bg-gray-800"
                        >
                          <Check size={16} />
                          保存
                        </button>
                        <button
                          onClick={resetForm}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center gap-1 hover:bg-gray-200"
                        >
                          <X size={16} />
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleActive(course.id, course.isActive)}
                          className={`p-1 rounded ${course.isActive ? 'text-emerald-600' : 'text-gray-400'}`}
                          title={course.isActive ? '公開中' : '非公開'}
                        >
                          {course.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                        <div>
                          <p className={`font-medium ${course.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                            {formatDisplayDate(course)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {course.isActive ? '公開中' : '非公開'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          title="編集"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="削除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Preview */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">プレビュー（フォームでの表示）</h2>
          <div className="space-y-2">
            {courseDates.filter(c => c.isActive).length === 0 ? (
              <p className="text-gray-500 text-sm">公開中の講座日程がありません</p>
            ) : (
              courseDates
                .filter(c => c.isActive)
                .map((course) => (
                  <div key={course.id} className="flex items-center p-4 border border-gray-200 rounded-xl">
                    <input type="radio" checked readOnly className="w-4 h-4 text-gray-900" />
                    <span className="ml-3 text-gray-900 font-medium">
                      {formatDisplayDate(course)}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <a href="/" className="text-gray-500 hover:text-gray-900 text-sm underline">
            申込フォームに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
