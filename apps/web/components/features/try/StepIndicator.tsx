/**
 * 步骤指示器组件
 *
 * 显示当前处理步骤
 */

'use client';

import type { Step, ContentType } from '@/lib/types/try-page';

interface StepIndicatorProps {
  currentStep: Step;
  contentType: ContentType;
}

export function StepIndicator({ currentStep, contentType }: StepIndicatorProps) {
  const videoSteps = [
    { id: 'upload', label: '上传' },
    { id: 'recognition', label: '识别' },
    { id: 'style', label: '风格' },
    { id: 'colorGrade', label: '调色' },
    { id: 'keyframe', label: '封面' },
    { id: 'processing', label: '处理' },
    { id: 'result', label: '完成' },
  ];

  const imageSteps = [
    { id: 'upload', label: '上传' },
    { id: 'recognition', label: '识别' },
    { id: 'style', label: '风格' },
    { id: 'processing', label: '处理' },
    { id: 'result', label: '完成' },
  ];

  const steps = contentType === 'video' ? videoSteps : imageSteps;
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '32px',
      }}
    >
      {steps.map((step, index) => (
        <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: index <= currentIndex ? '#D4AF37' : 'rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
            }}
          />
          {index < steps.length - 1 && (
            <div
              style={{
                width: '24px',
                height: '2px',
                background: index < currentIndex ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
