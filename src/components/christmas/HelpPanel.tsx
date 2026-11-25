import type { ReactNode } from 'react';
import { X, Grab, Hand, MousePointer, Move, Images, MousePointerClick, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INSTRUCTION_ITEMS, InstructionIcon } from '@/lib/instructions';

const iconMap: Record<InstructionIcon, ReactNode> = {
  fist: <Grab className="w-6 h-6 text-christmas-green" />,
  open: <Hand className="w-6 h-6 text-christmas-gold" />,
  pinch: <MousePointer className="w-6 h-6 text-christmas-red" />,
  move: <Move className="w-6 h-6 text-muted-foreground" />,
  photo: <Images className="w-6 h-6 text-christmas-gold" />,
  heart: <Heart className="w-6 h-6 text-christmas-red" />,
  mouse: <MousePointerClick className="w-6 h-6 text-muted-foreground" />,
};

const iconBgMap: Record<InstructionIcon, string> = {
  fist: 'bg-christmas-green/20',
  open: 'bg-christmas-gold/20',
  pinch: 'bg-christmas-red/20',
  move: 'bg-muted/30',
  photo: 'bg-christmas-gold/20',
  heart: 'bg-christmas-red/20',
  mouse: 'bg-muted/30',
};

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-gold rounded-2xl p-8 max-w-md mx-4 relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </Button>

        <h2 className="text-2xl font-display font-bold text-christmas-gold mb-6 text-center">
          🎄 操作说明
        </h2>

        <div className="space-y-4">
          {INSTRUCTION_ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${iconBgMap[item.icon]}`}>
                {iconMap[item.icon]}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            手势识别需要摄像头，建议在系统浏览器中打开；页面也支持鼠标操作。
          </p>
        </div>
      </div>
    </div>
  );
}
