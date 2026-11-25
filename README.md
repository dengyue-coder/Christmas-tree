# Christmas Tree · 3D 互动魔法圣诞树 🎄

一个基于 Three.js 的 3D 交互式圣诞树网页：粒子聚合成圣诞树，可通过摄像头手势或鼠标/触屏切换场景、浏览照片卡片、触发爱心动画，并配有雪花、粒子与背景音乐控制。

- 在线预览：https://christmas-tree.space/
- 前端工程：React 18 · Vite 5 · TypeScript

![预览](https://github.com/user-attachments/assets/c96f5f14-d837-43d1-a26a-3c06edfe198d)

## 交互玩法

| 手势 / 操作 | 效果 |
| --- | --- |
| 握拳 | 粒子聚合成圣诞树；查看照片或爱心时握拳退出 |
| 张开手掌 | 圣诞树散成粒子星空 |
| 捏合（拇指 + 食指） | 散成粒子后捏合，出现第一张照片 |
| 比心（拇指食指交叉） | 粉色粒子聚成一颗跳动的爱心 |
| 移动手部 | 星空模式下移动手部，环视场景 |
| 张开后再捏合 | 切换到下一张照片，循环浏览；也可点击或按 ← / → 键 |
| 鼠标 / 触屏（无摄像头时） | 单击切换树 / 星空，按住拖动旋转视角 |

## 技术栈

- **React 18** + **TypeScript** + **Vite**
- **Three.js**：`@react-three/fiber`、`@react-three/drei`、`@react-three/postprocessing`
- **MediaPipe Hands**：浏览器本地手势识别，无摄像头时自动回退鼠标/触屏操作
- **Tailwind CSS** + **Radix UI / shadcn-ui** 组件
- **GSAP** 动画、`lucide-react` 图标

## 快速开始

前置条件：安装 Node.js 18+ 与 npm（推荐用 nvm 管理版本）。

```sh
# 安装依赖
npm install

# 本地开发（热更新）
npm run dev

# 生产构建，输出到 dist/
npm run build

# 预览构建产物
npm run preview
```

开发服务器默认端口 `8080`，预览端口 `4173`（见 `vite.config.ts`）。

## 目录概览

```
src/
├── components/
│   ├── christmas/     # 场景、粒子、雪花、树星、爱心、照片卡片等
│   └── ui/            # Radix / shadcn 基础组件
├── hooks/             # 手势识别、音频、鼠标回退等自定义 Hook
├── lib/               # 动作说明等共享配置
├── pages/             # 页面路由（首页、404）
└── types/            # 类型定义
public/
├── photos/            # 照片卡片素材（真人照片不入库，见下方说明）
└── audio/             # 背景音乐（见下方说明）
```

## 关于背景音乐

出于版权与仓库体积考虑，仓库**不内置 MP3 音频**。如需开启背景音乐，请将已获授权的音频文件放到 `public/audio/`：

- `public/audio/last-christmas.mp3`（主曲目）
- `public/audio/christmas-music.mp3`（回退曲目）

音频加载失败时页面会自动静默，不影响其他交互。

## 关于照片卡片

出于隐私与肖像权考虑，仓库**不内置任何真人照片**。`public/photos/` 下仅保留占位说明；本地运行时若没有照片，卡片会自动显示圣诞树 🎄 占位纹理，不影响其他交互。如需展示自己的照片，请放入已获授权的图片（命名 `photo-1.jpg` … `photo-12.png`），详见该目录下的 `README.md`。

## 隐私说明

手势识别由 MediaPipe 在浏览器本地完成，摄像头画面不上传至服务器；照片上传同样仅在本地浏览器中处理。
