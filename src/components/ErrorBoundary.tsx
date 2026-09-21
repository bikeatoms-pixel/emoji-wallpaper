import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#B4CAB8] flex items-center justify-center p-6 text-zinc-900 font-sans">
          <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-black/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-bold">Emoji Workshop Ready to Recover</h2>
            <p className="text-xs text-zinc-600">
              An unexpected render issue occurred. You can safely restore the application defaults.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-zinc-900 text-white font-semibold text-sm flex items-center justify-center space-x-2 cursor-pointer hover:bg-zinc-800 transition-colors shadow-md"
            >
              <RefreshCw size={16} />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
