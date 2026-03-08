import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useCourseDates } from '../context/CourseDateContext';
import { FormData } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXKe4Df3eRWaV6q6esAa6RUXdtK4i_IfRWQJNUgVlBRzJfzi7ukj84onVUWbJOoFJOYQ/exec';

/**
 * 数字のみの電話番号文字列にハイフンを自動挿入する。
 * 例: "09012345678" → "090-1234-5678"
 *     "0312345678"  → "03-1234-5678"
 * すでにハイフンが含まれている場合はそのまま返す。
 */
function formatPhoneNumber(phone: string): string {
  // すでにハイフンが含まれている場合はそのまま返す
  if (phone.includes('-')) {
    return phone;
  }

  const digits = phone.replace(/[^0-9]/g, '');

  // 携帯電話 (090, 080, 070, 050): 3-4-4
  if (/^0[5789]0/.test(digits) && digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  // 固定電話（市外局番2桁: 03, 06など）: 2-4-4
  if (/^0[3-6]/.test(digits) && digits.length === 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // 固定電話（市外局番3桁）: 3-3-4 or 3-4-4
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  // フォーマットできない場合はそのまま
  return phone;
}

export default function ApplicationForm() {
  const { getActiveDates, isLoading } = useCourseDates();
  const activeDates = getActiveDates();

  const formatDateOption = (course: { date: string; time: string; venue: string }) => {
    return `${course.date} ${course.time}【${course.venue}】`;
  };

  const initialFormData: FormData = {
    email: '',
    date: activeDates.length > 0 ? formatDateOption(activeDates[0]) : '',
    name: '',
    participants: '',
    phone: '',
    applicationNumber: '',
    experience: '',
    questions: '',
    privacy: false,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeDates.length > 0 && !formData.date) {
      setFormData(prev => ({ ...prev, date: formatDateOption(activeDates[0]) }));
    }
  }, [activeDates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // 電話番号フィールドは数字とハイフンのみ許可
    if (name === 'phone') {
      const sanitized = value.replace(/[^0-9\-]/g, '');
      setFormData(prev => ({ ...prev, phone: sanitized }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.name || !formData.participants || !formData.phone || !formData.applicationNumber || !formData.experience || !formData.privacy) {
      setError('必須項目をすべて入力してください。');
      return;
    }

    // 電話番号の桁数チェック（ハイフンを除いた数字が10〜11桁）
    const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError('電話番号を正しく入力してください。');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!GOOGLE_SCRIPT_URL) {
        setError('【連携エラー】スプレッドシートと連携するための「ウェブアプリURL」が設定されていません。');
        setIsSubmitting(false);
        return;
      }

      // 送信データの電話番号を自動フォーマット（ハイフン付き）
      const submitData = {
        ...formData,
        phone: formatPhoneNumber(formData.phone),
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      setIsSubmitted(true);
    } catch (err) {
      setError('送信中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">お申し込み完了</h2>
          <p className="text-gray-600 mb-10 leading-relaxed text-sm">
            ご入力いただいた内容を受け付けました。<br />
            当日はお気をつけてお越しください。
          </p>
          <button
            onClick={() => {
              setFormData({
                ...initialFormData,
                date: activeDates.length > 0 ? formatDateOption(activeDates[0]) : '',
              });
              setIsSubmitted(false);
            }}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            トップページへ戻る
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gray-900 selection:text-white">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="bg-gray-900 px-8 py-12 text-white text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            【屋根・外壁メンテナンス講座】<br />申込フォーム
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed max-w-lg mx-auto">
            以下のフォームにご入力ください。<br />
            なお、ご入力いただいた個人情報は一切外部への流用は致しませんので<br />
            ご安心ください。
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-10 py-10 space-y-10">

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              メールアドレス <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none text-gray-900 bg-gray-50/50 focus:bg-white"
              placeholder="example@email.com"
            />
          </div>

          {/* 1. Date */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              1. 参加希望日時をお選びください <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="space-y-2">
              {activeDates.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 border border-gray-200 rounded-xl">
                  現在、申込可能な講座日程はありません。
                </p>
              ) : (
                activeDates.map((course) => {
                  const dateOption = formatDateOption(course);
                  return (
                    <label
                      key={course.id}
                      className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${formData.date === dateOption
                          ? 'border-gray-900 bg-gray-50/50'
                          : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="date"
                        value={dateOption}
                        checked={formData.date === dateOption}
                        onChange={handleChange}
                        className="w-4 h-4 text-gray-900 focus:ring-gray-900 border-gray-300"
                      />
                      <span className="ml-3 text-gray-900 font-medium">{dateOption}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Name */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              2. お名前をご入力ください <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none text-gray-900 bg-gray-50/50 focus:bg-white"
              placeholder="山田 太郎"
            />
          </div>

          {/* 3. Participants */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              3. 参加予定人数をご選択ください <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['1人', '2人', '3人', '4人以上'].map((num) => (
                <label key={num} className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.participants === num ? 'border-gray-900 bg-gray-900 text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  <input
                    type="radio"
                    name="participants"
                    value={num}
                    checked={formData.participants === num}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{num}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Phone */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              4. 電話番号を教えてください <span className="text-red-500 ml-1">*</span>
            </label>
            <p className="text-xs text-gray-500">※ハイフンあり・なしどちらでもOKです。講座の中止・変更等の緊急連絡を行う場合がございます。</p>
            <input
              type="text"
              inputMode="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none text-gray-900 bg-gray-50/50 focus:bg-white"
              placeholder="09012345678"
            />
          </div>

          {/* 5. Application Number */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              5. チラシに記載されている申込番号をご入力ください <span className="text-red-500 ml-1">*</span>
            </label>
            <p className="text-xs text-gray-500">※チラシの申込欄に記載されている5桁の番号</p>
            <input
              type="text"
              name="applicationNumber"
              required
              value={formData.applicationNumber}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none text-gray-900 bg-gray-50/50 focus:bg-white"
              placeholder="12345"
            />
          </div>

          {/* 6. Experience */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              6. これまでに塗り替え講座に参加されたご経験はありますか？ <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="space-y-2">
              {[
                'はじめて参加する',
                '以前、参加したことがある（当講座）',
                '以前、参加したことがある（当講座以外）'
              ].map((exp) => (
                <label key={exp} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${formData.experience === exp ? 'border-gray-900 bg-gray-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="experience"
                    value={exp}
                    checked={formData.experience === exp}
                    onChange={handleChange}
                    className="w-4 h-4 text-gray-900 focus:ring-gray-900 border-gray-300"
                  />
                  <span className="ml-3 text-gray-900 font-medium text-sm">{exp}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 7. Questions */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              7. 講座当日、聞きたいこと・話して欲しいことがございましたら、ご自由にご入力ください。
            </label>
            <textarea
              name="questions"
              value={formData.questions}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none resize-none text-gray-900 bg-gray-50/50 focus:bg-white"
              placeholder="ご自由にご記入ください..."
            />
          </div>

          {/* 8. Privacy Policy */}
          <div className="space-y-5 pt-8 border-t border-gray-100">
            <label className="block text-sm font-bold text-gray-900">
              8. プライバシーポリシーの同意 <span className="text-red-500 ml-1">*</span>
            </label>

            <div className="bg-gray-50 p-6 rounded-xl text-xs text-gray-600 space-y-5 h-48 overflow-y-auto border border-gray-200">
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-sm">【個人情報利用目的・プライバシーポリシー】</h4>
                <p className="font-bold text-gray-800 mt-3">個人情報利用目的：</p>
                <ul className="list-disc pl-4 mt-2 space-y-1.5 leading-relaxed">
                  <li>お客様のご要望に合わせたサービスを提供させていただくための各種ご連絡。</li>
                  <li>お問い合わせいただいたご質問への回答のご連絡。</li>
                </ul>
                <p className="mt-3 leading-relaxed">尚、お客様から収集する個人情報は弊社の定めるプライバシーポリシーに則って厳重に管理いたします。</p>
              </div>
              <div>
                <p className="font-bold text-gray-800">プライバシーポリシー：</p>
                <p className="mt-2 leading-relaxed">弊社では、利用者のみなさんの個人情報がきちんと守られることを、何よりも大切にしています。また、利用者ご本人への事前の許可なしに第三者に個人情報を配信作業以外に開示することは絶対にいたしません。</p>
              </div>
            </div>

            <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors mt-4 ${formData.privacy ? 'border-gray-900 bg-gray-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  name="privacy"
                  required
                  checked={formData.privacy}
                  onChange={handleChange}
                  className="w-5 h-5 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                />
              </div>
              <div className="ml-3 text-sm">
                <span className="font-bold text-gray-900">下記のプライバシーポリシーに同意します</span>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting || activeDates.length === 0}
              className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all flex items-center justify-center ${isSubmitting || activeDates.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-gray-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  送信中...
                </span>
              ) : (
                <span className="flex items-center">
                  申し込む
                  <ChevronRight className="ml-2 w-5 h-5" />
                </span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
