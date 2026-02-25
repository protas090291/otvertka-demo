import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-white">
            <h1 className="text-xl font-semibold text-red-300 mb-2">Ошибка загрузки</h1>
            <p className="text-slate-300 text-sm mb-4">{this.state.error.message}</p>
            <pre className="text-xs text-slate-500 overflow-auto max-h-40 bg-black/30 p-3 rounded-lg">
              {this.state.error.stack}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
