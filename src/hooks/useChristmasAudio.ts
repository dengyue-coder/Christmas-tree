import { useState, useRef, useEffect, useCallback } from 'react';

// 背景音乐：将正版 / 已获授权的音频文件放到 public/audio/last-christmas.mp3
// 优先加载它；若文件不存在，则自动回退到内置的 christmas-music.mp3
const PRIMARY_MUSIC_URL = '/audio/last-christmas.mp3';
const FALLBACK_MUSIC_URL = '/audio/christmas-music.mp3';

export function useChristmasAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.src = PRIMARY_MUSIC_URL;
    audio.loop = true;
    audio.volume = volume;
    audio.preload = 'auto';

    let fellBack = false;

    audio.addEventListener('canplaythrough', () => {
      setIsLoaded(true);
    });

    audio.addEventListener('error', () => {
      // 主曲目缺失时回退到内置音乐，避免页面无声
      if (!fellBack) {
        fellBack = true;
        audio.src = FALLBACK_MUSIC_URL;
      } else {
        console.warn('Audio loading error: fallback also failed');
      }
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('Audio playback failed:', error);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    isPlaying,
    isMuted,
    isLoaded,
    volume,
    setVolume,
    play,
    pause,
    toggle,
    toggleMute,
  };
}
