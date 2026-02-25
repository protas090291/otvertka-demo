import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export default function SystemStatusView() {
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [startingBackend, setStartingBackend] = useState(false);
  const [startBackendError, setStartBackendError] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    setChecking(true);
    setBackendOk(null);
    setDbOk(null);
    setDbError(null);

    try {
      const [backendResult, dbResult] = await Promise.all([
        fetch(`${BACKEND_URL}/health`, { method: 'GET' }).then((res) => res.ok).catch(() => false),
        supabase.from('projects').select('id').limit(1).then(({ error }) => ({ ok: !error, msg: error?.message || null })).catch((e: any) => ({
          ok: false,
          msg: /abort|timeout/i.test(e?.message || '') ? 'Таймаут или обрыв сети. Проверьте интернет.' : (e?.message || 'Ошибка подключения')
        }))
      ]);

      setBackendOk(backendResult);
      setDbOk(dbResult.ok);
      setDbError(dbResult.msg);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const startBackend = useCallback(async () => {
    setStartBackendError(null);
    setStartingBackend(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${origin}/api/start-backend`, { method: 'POST' });
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : {};
      if (!res.ok) {
        setStartBackendError(data.error || `HTTP ${res.status}: ${res.statusText}`);
        return;
      }
      if (!data.ok) {
        setStartBackendError(data.error || 'Сервер не поддержал запуск. Запускайте фронт через npm run dev.');
        return;
      }
      setTimeout(() => runChecks(), 8000);
    } catch (e) {
      setStartBackendError(e instanceof Error ? e.message : 'Ошибка сети');
    } finally {
      setStartingBackend(false);
    }
  }, [runChecks]);

  const frontendOk = true;
  const allOk = backendOk === true && frontendOk && dbOk === true;

  const statusBadge = (ok: boolean | null, labelOk: string, labelFail: string) => {
    if (ok === null) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-slate-500/20 text-slate-300 border border-slate-500/30">
          <Loader2 className="w-3 h-3 animate-spin" /> проверка...
        </span>
      );
    }
    return ok ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
        <CheckCircle className="w-3 h-3" /> {labelOk}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
        <XCircle className="w-3 h-3" /> {labelFail}
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg p-6 relative">
        {allOk ? (
          <div className="absolute top-6 right-6 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Подключено
          </div>
        ) : (
          <div className="absolute top-6 right-6 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Не подключено
          </div>
        )}

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            <div className={`w-1 h-12 rounded-full flex-shrink-0 ${backendOk === true ? 'bg-green-500' : backendOk === false ? 'bg-red-400' : 'bg-slate-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white">Backend API</p>
              <p className="text-sm text-slate-400 truncate">{BACKEND_URL}</p>
              <div className="mt-1">
                {backendOk === null && statusBadge(null, '', '')}
                {backendOk === true && statusBadge(true, 'Доступен', '')}
                {backendOk === false && (
                  <div className="flex flex-wrap items-center gap-2">
                    {statusBadge(false, '', 'Не доступен')}
                    <span className="text-xs text-slate-400">Или нажмите «Запустить бэкенд» ниже</span>
                    {startBackendError && (
                      <span className="text-xs text-red-300 block w-full mt-1">{startBackendError}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-1 h-12 rounded-full flex-shrink-0 bg-green-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white">Frontend</p>
              <p className="text-sm text-slate-400 truncate">{FRONTEND_URL}</p>
              <div className="mt-1">{statusBadge(true, 'Работает', '')}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`w-1 h-12 rounded-full flex-shrink-0 ${dbOk === true ? 'bg-green-500' : dbOk === false ? 'bg-red-400' : 'bg-slate-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white">База данных</p>
              <p className="text-sm text-slate-400">Supabase</p>
              <div className="mt-1">
                {dbOk === null && statusBadge(null, '', '')}
                {dbOk === true && statusBadge(true, 'Подключена', '')}
                {dbOk === false && (
                  <div className="flex flex-col gap-1">
                    {statusBadge(false, '', 'Нет подключения')}
                    <span className="text-xs text-red-300/90">{dbError || 'Проверьте интернет и настройки Supabase в src/lib/supabase.ts'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {backendOk === false && (
          <button
            type="button"
            onClick={() => startBackend()}
            disabled={startingBackend}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            {startingBackend ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Запустить бэкенд
          </button>
        )}
        <button
          type="button"
          onClick={() => runChecks()}
          disabled={checking}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Повторить проверку
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg p-4">
        <p className="font-medium text-slate-200 mb-3">Быстрые ссылки</p>
        <ul className="space-y-2 text-sm">
          <li>
            <a href={`${BACKEND_URL}/docs`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors">
              <ExternalLink className="w-4 h-4" /> API Документация
            </a>
          </li>
          <li>
            <a href={`${BACKEND_URL}/health`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors">
              <ExternalLink className="w-4 h-4" /> Health Check
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
