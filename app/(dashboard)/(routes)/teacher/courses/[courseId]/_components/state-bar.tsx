"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/use-i18n";

export default function CourseStateBar({ courseId, mode, state }: { courseId: string, mode: number, state: number }) {

  const [courseState, setCourseState] = useState(state);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const changeState = async (newState: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || t('stateBar.noActiveModules'));
      } else {
        setCourseState(newState);
      }
    } catch (e) {
      setError(t('stateBar.networkError'));
    }
    setLoading(false);
  };

  useEffect(() => {
    setCourseState(state);
  }, [state]);

  return (
    <div className="mb-6">
      {error && (
        <div className="w-full p-2 mb-2 bg-red-100 border border-red-300 rounded text-red-800 font-medium">
          {error}
        </div>
      )}
      {courseState === 0 && (
        <div className="w-full p-3 bg-yellow-100 border border-yellow-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-yellow-800 font-medium">{t('stateBar.draftMsg')}</span>
          <div className="ml-auto flex gap-2">
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(1)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.publish')}
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(2)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.publishWip')}
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(3)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.archive')}
            </button>
          </div>
        </div>
      )}
      {courseState === 1 && (
        <div className="w-full p-3 bg-green-100 border border-green-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-green-800 font-medium">{t('stateBar.publishedMsg')}</span>
          <div className="ml-auto flex gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(2)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.wip')}
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(3)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.archive')}
            </button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(0)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.backToDraft')}
            </button>
          </div>
        </div>
      )}
      {courseState === 2 && (
        <div className="w-full p-3 bg-blue-100 border border-blue-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-blue-800 font-medium">{t('stateBar.publishedWipMsg')}</span>
          <div className="ml-auto flex gap-2">
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(1)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.closeContent')}
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(3)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.archive')}
            </button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(0)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.backToDraft')}
            </button>
          </div>
        </div>
      )}
      {courseState === 3 && (
        <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-gray-800 font-medium">{t('stateBar.archivedMsg')}</span>
          <div className="ml-auto flex gap-2">
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(0)}
              disabled={loading}
            >
              {loading ? t('stateBar.saving') : t('stateBar.restoreToDraft')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}