// 共享的操作说明条目，供首次弹窗与帮助面板复用

export type InstructionIcon =
  | 'fist'
  | 'open'
  | 'pinch'
  | 'move'
  | 'photo'
  | 'heart'
  | 'mouse';

export interface InstructionItem {
  icon: InstructionIcon;
  title: string;
  description: string;
}

export const INSTRUCTION_ITEMS: InstructionItem[] = [
  {
    icon: 'fist',
    title: '握拳',
    description: '粒子聚合成圣诞树；查看照片或爱心时握拳可退出',
  },
  {
    icon: 'open',
    title: '张开手掌',
    description: '圣诞树爆炸成粒子星空',
  },
  {
    icon: 'pinch',
    title: '捏合手势',
    description: '散成粒子后捏合拇指与食指，呈现第一张照片',
  },
  {
    icon: 'heart',
    title: '比心手势',
    description: '拇指食指交叉比心，粉色粒子汇聚成一颗跳动的爱心',
  },
  {
    icon: 'move',
    title: '移动手部',
    description: '在星空模式下移动手部，环绕查看场景',
  },
  {
    icon: 'photo',
    title: '切换照片',
    description: '保持手部不动，张开拇指食指再捏合算一次信号，自动切到下一张，依次遍历全部照片后循环回第一张；也可点箭头或按键盘 ← / →',
  },
  {
    icon: 'mouse',
    title: '鼠标 / 触屏',
    description: '没有摄像头时：双击切换 树 / 星空，按住拖动即可旋转视角',
  },
];
