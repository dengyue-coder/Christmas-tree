import { useState, useCallback, useEffect, lazy, Suspense, useRef } from 'react';
import { GestureIndicator } from '@/components/christmas/GestureIndicator';
import { AudioControl } from '@/components/christmas/AudioControl';
import { PhotoUpload } from '@/components/christmas/PhotoUpload';
import { InstructionsOverlay } from '@/components/christmas/InstructionsOverlay';
import { HelpPanel } from '@/components/christmas/HelpPanel';
import { SettingsPanel } from '@/components/christmas/SettingsPanel';
import { CameraDebug } from '@/components/christmas/CameraDebug';
import { LoadingScreen } from '@/components/christmas/LoadingScreen';
import { CustomTextOverlay } from '@/components/christmas/CustomTextOverlay';
import { useHandGesture } from '@/hooks/useHandGesture';
import { useMouseFallback } from '@/hooks/useMouseFallback';
import { useChristmasAudio } from '@/hooks/useChristmasAudio';
import { TreeState, GestureType } from '@/types/christmas';
import { Github, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// Lazy load heavy 3D scene
const ChristmasScene = lazy(() => import('@/components/christmas/Scene').then(m => ({ default: m.ChristmasScene })));

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [treeState, setTreeState] = useState<TreeState>('tree');
  const [photos, setPhotos] = useState<string[]>([]);
  const [focusedPhotoIndex, setFocusedPhotoIndex] = useState<number | null>(null);
  const [orbitRotation, setOrbitRotation] = useState({ x: 0, y: 0 });
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'requesting'>('prompt');
  const [showInstructions, setShowInstructions] = useState(true);
  const [customText, setCustomText] = useState('Merry Christmas');
  const [isStarFocused, setIsStarFocused] = useState(false);
  const [sensitivity, setSensitivity] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  
  // Use refs for values accessed in callbacks to prevent re-renders
  const treeStateRef = useRef(treeState);
  const photosRef = useRef(photos);
  const introDoneRef = useRef(introDone);
  treeStateRef.current = treeState;
  photosRef.current = photos;
  introDoneRef.current = introDone;

  // 捏合信号防抖时间戳，避免手部抖动在一次捏合内重复切图
  const lastPinchSignalRef = useRef(0);

  // Simulate loading progress - slower interval
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Mark as loaded when scene is ready
  const handleSceneReady = useCallback(() => {
    setLoadingProgress(100);
  }, []);

  // Audio hook
  const audio = useChristmasAudio();

  // Gesture handling - use refs to avoid callback recreation
  const handleGestureChange = useCallback((gesture: GestureType) => {
    // Ignore gestures during the opening intro sequence
    if (!introDoneRef.current) return;
    const currentTreeState = treeStateRef.current;

    switch (gesture) {
      case 'fist':
        setTreeState('tree');
        setFocusedPhotoIndex(null);
        break;
      case 'heart':
        // 比心：画面化作 3D 粉色爱心；握拳返回圣诞树
        setTreeState('heart');
        setFocusedPhotoIndex(null);
        break;
      case 'open':
        // 聚焦照片或在爱心场景时，松开手指常被误判成张开手掌；此时不退出、
        // 不清空，避免把当前状态重置。退出请握拳回到圣诞树。
        if (currentTreeState !== 'focus' && currentTreeState !== 'heart') {
          setTreeState('galaxy');
          setFocusedPhotoIndex(null);
        }
        break;
      case 'pinch': {
        const now = Date.now();
        if (currentTreeState === 'galaxy') {
          // 散成粒子后第一次捏合：呈现第一张照片
          setFocusedPhotoIndex(0);
          setTreeState('focus');
          lastPinchSignalRef.current = now;
        } else if (currentTreeState === 'focus') {
          // 一次“张开拇指食指 - 再捏合”算一次信号；防抖防止抖动连切
          if (now - lastPinchSignalRef.current < 500) return;
          lastPinchSignalRef.current = now;
          setFocusedPhotoIndex(prev => {
            const total = Math.min(photosRef.current.length > 0 ? photosRef.current.length : 12, 12);
            const current = prev === null ? 0 : prev;
            return (current + 1) % total; // 循环一轮后回到第一张
          });
        }
        break;
      }
    }
  }, []); // Empty deps - uses refs

  // Cycle between photos when one is focused
  const handleCyclePhoto = useCallback((dir: 1 | -1) => {
    setFocusedPhotoIndex(prev => {
      if (prev === null) return prev;
      const total = Math.min(photosRef.current.length > 0 ? photosRef.current.length : 12, 12);
      return (prev + dir + total) % total;
    });
  }, []);

  // Keyboard arrows switch focused photo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (treeStateRef.current !== 'focus') return;
      if (e.key === 'ArrowLeft') handleCyclePhoto(-1);
      else if (e.key === 'ArrowRight') handleCyclePhoto(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCyclePhoto]);

  // Request camera permission - actually request it now
  const handleRequestCamera = useCallback(async () => {
    console.log('[Index] Requesting camera permission...');
    setCameraPermission('requesting');
    try {
      // Actually request camera permission from the browser
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      console.log('[Index] Camera permission granted!');
      // Keep the stream alive - MediaPipe will use it
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
    } catch (error) {
      console.error('[Index] Camera permission denied:', error);
      setCameraPermission('denied');
    }
  }, []);

  // Hand gesture hook
  const handGesture = useHandGesture({
    enabled: cameraPermission === 'granted',
    onGestureChange: handleGestureChange,
  });

  // Mouse fallback hook
  const mouseFallback = useMouseFallback({
    enabled: !handGesture.isTracking && introDone,
    currentState: treeState,
    onStateChange: setTreeState,
    onOrbitChange: setOrbitRotation,
    sensitivity,
  });

  // Update orbit from hand position
  useEffect(() => {
    if (handGesture.isTracking && handGesture.handPosition && treeState === 'galaxy') {
      setOrbitRotation({
        x: (handGesture.handPosition.y - 0.5) * Math.PI * 0.5 * sensitivity,
        y: (handGesture.handPosition.x - 0.5) * Math.PI * 2 * sensitivity,
      });
    }
  }, [handGesture.handPosition, handGesture.isTracking, treeState, sensitivity]);

  const handleDismissInstructions = useCallback(() => {
    setShowInstructions(false);
    // Auto-play music after dismissing instructions
    audio.play();
  }, [audio]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Loading Screen */}
      {!isLoaded && (
        <LoadingScreen 
          progress={loadingProgress} 
          onLoaded={() => setIsLoaded(true)} 
        />
      )}

      {/* 3D Scene - Lazy loaded with Suspense */}
      <Suspense fallback={null}>
        <ChristmasScene
          state={treeState}
          photos={photos}
          focusedPhotoIndex={focusedPhotoIndex}
          orbitRotation={orbitRotation}
          handPosition={handGesture.isTracking ? handGesture.handPosition : null}
          intro={isLoaded && !introDone}
          onReady={handleSceneReady}
          onStarFocusChange={setIsStarFocused}
          onIntroComplete={() => setIntroDone(true)}
        />
      </Suspense>

      {/* UI Overlays - only show after loaded and opening intro finished */}
      {isLoaded && introDone && (
        <>
          <GestureIndicator
            gesture={handGesture.gesture}
            isTracking={handGesture.isTracking}
            usingMouse={!handGesture.isTracking}
            cameraPermission={cameraPermission}
            mediapipeStatus={handGesture.status}
            onRequestCamera={handleRequestCamera}
          />

          <AudioControl
            isPlaying={audio.isPlaying}
            isMuted={audio.isMuted}
            onToggle={audio.toggle}
            onMuteToggle={audio.toggleMute}
          />

          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
          />

          {/* Camera Debug Preview */}
          <CameraDebug enabled={cameraPermission === 'granted'} />

          {/* Instructions Overlay */}
          {showInstructions && (
            <InstructionsOverlay onDismiss={handleDismissInstructions} />
          )}

          {/* Help panel (reopenable) */}
          <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} />

          {/* Top-right actions: settings + help + GitHub */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <SettingsPanel
              open={showSettings}
              onToggle={() => setShowSettings((v) => !v)}
              sensitivity={sensitivity}
              onSensitivityChange={setSensitivity}
            />
            <button
              onClick={() => setShowHelp(true)}
              className="glass rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="操作说明"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <a
              href="https://github.com/zebo101/christmas-tree"
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="View on GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>

          {/* Photo prev / next arrows when a photo is focused */}
          {treeState === 'focus' && focusedPhotoIndex !== null && (
            <>
              <button
                onClick={() => handleCyclePhoto(-1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 glass-gold rounded-full p-3 text-foreground hover:scale-105 active:scale-95 transition-all"
                title="上一张"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleCyclePhoto(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 glass-gold rounded-full p-3 text-foreground hover:scale-105 active:scale-95 transition-all"
                title="下一张"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Custom text overlay and edit button */}
          <CustomTextOverlay
            isVisible={isStarFocused}
            text={customText}
            onTextChange={setCustomText}
          />
        </>
      )}
    </div>
  );
};

export default Index;
