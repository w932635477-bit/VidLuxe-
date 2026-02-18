// 错误状态组件
// 用于显示各种错误和空状态

interface ErrorStateProps {
  type: 'upload' | 'processing' | 'network' | 'quota' | 'generic';
  message?: string;
  onRetry?: () => void;
  onContact?: () => void;
}

const ERROR_CONFIGS = {
  upload: {
    icon: '❌',
    title: '上传失败',
    defaultMessage: '文件大小超过限制（最大 10MB）',
    tip: '建议：压缩图片后重试',
    primaryAction: '重新上传',
    secondaryAction: undefined,
  },
  processing: {
    icon: '❌',
    title: '处理失败',
    defaultMessage: 'AI 服务暂时不可用',
    tip: '请稍后重试，或联系客服',
    primaryAction: '重试',
    secondaryAction: '联系客服',
  },
  network: {
    icon: '⚠️',
    title: '网络连接已断开',
    defaultMessage: '请检查网络连接后重试',
    tip: undefined,
    primaryAction: '重新连接',
    secondaryAction: undefined,
  },
  quota: {
    icon: '🔒',
    title: '配额已用完',
    defaultMessage: '本月免费额度已用完',
    tip: '升级 Pro 版可获得无限次使用',
    primaryAction: '升级 Pro',
    secondaryAction: undefined,
  },
  generic: {
    icon: '❌',
    title: '出错了',
    defaultMessage: '发生未知错误',
    tip: undefined,
    primaryAction: '重试',
    secondaryAction: undefined,
  },
};

export function ErrorState({ type, message, onRetry, onContact }: ErrorStateProps) {
  const config = ERROR_CONFIGS[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* 图标 */}
      <span className="text-5xl mb-4">{config.icon}</span>

      {/* 标题 */}
      <h3 className="text-xl font-medium text-content-primary mb-2">
        {config.title}
      </h3>

      {/* 消息 */}
      <p className="text-content-secondary text-center max-w-md mb-4">
        {message || config.defaultMessage}
      </p>

      {/* 提示 */}
      {config.tip && (
        <p className="text-sm text-content-tertiary mb-6">
          💡 {config.tip}
        </p>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-gold px-6 py-2"
          >
            {config.primaryAction}
          </button>
        )}
        {onContact && config.secondaryAction && (
          <button
            onClick={onContact}
            className="px-6 py-2 rounded-xl border border-white/20 text-content-secondary hover:bg-white/5 transition-colors"
          >
            {config.secondaryAction}
          </button>
        )}
      </div>
    </div>
  );
}

// 加载状态组件
interface LoadingStateProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export function LoadingState({ message = '加载中...', showProgress = false, progress = 0 }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* 加载动画 */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
      </div>

      {/* 消息 */}
      <p className="text-content-secondary mb-4">{message}</p>

      {/* 进度条 */}
      {showProgress && (
        <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// 空状态组件
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-xl font-medium text-content-primary mb-2">{title}</h3>
      {description && (
        <p className="text-content-secondary text-center max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-gold px-6 py-2">
          {action.label}
        </button>
      )}
    </div>
  );
}
