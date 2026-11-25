import { useState, useEffect } from 'react';
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

interface InstructionsOverlayProps {
  onDismiss: () => void;
}

export function InstructionsOverlay({ onDismiss }: InstructionsOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has seen instructions before
    const hasSeenInstructions = localStorage.getItem('christmas-tree-instructions-seen');
    if (!hasSeenInstructions) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('christmas-tree-instructions-seen', 'true');
    setShow(false);
    onDismiss();
  };

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-gold rounded-2xl p-8 max-w-md mx-4 relative max-h-[85vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </Button>

        <h2 className="text-2xl font-display font-bold text-christmas-gold mb-6 text-center">
          🎄 欢迎来到魔法圣诞树
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
          <p className="text-xs text-muted-foreground text-center mb-4">
            没有摄像头？双击切换模式，拖动旋转视角！
          </p>

          <Button
            onClick={handleDismiss}
            className="w-full bg-christmas-gold hover:bg-christmas-gold/90 text-christmas-deep-blue font-semibold"
          >
            开始体验 ✨
          </Button>
        </div>
      </div>
    </div>
  );
}
