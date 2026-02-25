import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface AnimatedVoiceAssistantProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  className?: string;
}

const AnimatedVoiceAssistant: React.FC<AnimatedVoiceAssistantProps> = ({
  isListening,
  isProcessing,
  onClick,
  className = ""
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  return (
    <div className={`voice-assistant-compact ${className}`}>
      <div className="voice-assistant-compact-wrap" onClick={handleClick} role="button" aria-label="Голосовой ввод">
        <input
          type="checkbox"
          checked={isListening}
          readOnly
          tabIndex={-1}
          aria-hidden
        />
        <div className="voice-assistant-compact-card">
          <div className="voice-assistant-compact-outline"></div>
          <div className="voice-assistant-compact-wave"></div>
          
          <div className="voice-assistant-compact-circle-1">
            <div className="lines">
              <svg viewBox="0 0 100 100" width="60" height="60">
                {Array.from({ length: 8 }, (_, i) => (
                  <path
                    key={i}
                    d={`M 50 50 L ${50 + 20 * Math.cos((i * 45) * Math.PI / 180)} ${50 + 20 * Math.sin((i * 45) * Math.PI / 180)}`}
                    style={{ '--i': i } as React.CSSProperties}
                  />
                ))}
              </svg>
            </div>
          </div>
          
          <div className="voice-assistant-compact-circle-2">
            <div className="bg"></div>
          </div>
          
          <div className="voice-assistant-compact-icon voice-assistant-compact-icon-1">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
                fill="currentColor"
              />
              <path
                d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H7V12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12V10H19Z"
                fill="currentColor"
              />
              <path
                d="M11 22H13V24H11V22Z"
                fill="currentColor"
              />
              <path
                d="M7 22H9V24H7V22Z"
                fill="currentColor"
              />
              <path
                d="M15 22H17V24H15V22Z"
                fill="currentColor"
              />
            </svg>
          </div>
          
          <div className="voice-assistant-compact-icon voice-assistant-compact-icon-2">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cut">
              <path
                d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
                fill="currentColor"
              />
              <path
                d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H7V12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12V10H19Z"
                fill="currentColor"
              />
              <path
                d="M11 22H13V24H11V22Z"
                fill="currentColor"
              />
              <path
                d="M7 22H9V24H7V22Z"
                fill="currentColor"
              />
              <path
                d="M15 22H17V24H15V22Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedVoiceAssistant;
