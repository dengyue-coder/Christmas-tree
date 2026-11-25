import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsPanelProps {
  open: boolean;
  onToggle: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export function SettingsPanel({ open, onToggle, sensitivity, onSensitivityChange }: SettingsPanelProps) {
  return (
    <div className="relative flex flex-col items-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="glass rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
        title="旋转设置"
      >
        {open ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
      </Button>

      {open && (
        <div className="glass rounded-xl p-4 w-64 shadow-lg absolute top-12 right-0 z-30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">旋转灵敏度</span>
            <span className="text-xs text-christmas-gold font-semibold">
              ×{sensitivity.toFixed(1)}
            </span>
          </div>

          <input
            type="range"
            min={0.2}
            max={2}
            step={0.1}
            value={sensitivity}
            onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
            className="w-full accent-christmas-gold"
          />

          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>低 / 平稳</span>
            <span>高 / 灵敏</span>
          </div>

          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            调整拖动视角与手部控制的转动幅度，数值越低越平稳。
          </p>
        </div>
      )}
    </div>
  );
}
