import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { useVoiceover } from '@/lib/video/voiceover';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5Inbox } from './video_scenes/Scene5Inbox';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';
import { Scene8Setup } from './video_scenes/Scene8Setup';
import { Scene9Training } from './video_scenes/Scene9Training';
import { Scene10Pricing } from './video_scenes/Scene10Pricing';
import { Scene11Proof } from './video_scenes/Scene11Proof';
import { Scene12 } from './video_scenes/Scene12';

export const SCENE_DURATIONS: Record<string, number> = {
  hook:       18000,
  agitation:  22000,
  intro:      20000,
  aiReply:    35000,
  inbox:      30000,
  broadcast:  28000,
  dashboard:  28000,
  setup:      20000,
  training:   25000,
  pricing:    20000,
  proof:      22000,
  closing:    25000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook:       Scene1,
  agitation:  Scene2,
  intro:      Scene3,
  aiReply:    Scene4,
  inbox:      Scene5Inbox,
  broadcast:  Scene6,
  dashboard:  Scene7,
  setup:      Scene8Setup,
  training:   Scene9Training,
  pricing:    Scene10Pricing,
  proof:      Scene11Proof,
  closing:    Scene12,
};

const SCENE_KEYS = Object.keys(SCENE_DURATIONS);

const bgPositions = SCENE_KEYS.map((_, i) => ({
  x: `${10 + (i * 7.3) % 60}vw`,
  y: `${10 + (i * 11.7) % 60}vh`,
  scale: 1.4 + (i % 4) * 0.3,
  opacity: 0.06 + (i % 3) * 0.02,
}));

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
  voiceoverEnabled = false,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
  voiceoverEnabled?: boolean;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  useVoiceover(currentSceneKey, voiceoverEnabled);

  const baseKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = SCENE_KEYS.indexOf(baseKey);
  const SceneComponent = SCENE_COMPONENTS[baseKey];
  const bgPos = bgPositions[Math.max(0, sceneIndex)];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#060F1E]">
      <motion.div
        className="absolute w-[55vw] h-[55vw] rounded-full bg-[#25D366] blur-[140px] pointer-events-none"
        animate={{ x: bgPos.x, y: bgPos.y, scale: bgPos.scale, opacity: bgPos.opacity }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ left: '-15vw', top: '-15vh' }}
      />
      <motion.div
        className="absolute w-[35vw] h-[35vw] rounded-full bg-[#FF6B35] blur-[120px] pointer-events-none"
        animate={{
          x: sceneIndex % 2 === 0 ? '72vw' : '8vw',
          y: sceneIndex % 2 === 0 ? '68vh' : '8vh',
          opacity: [0.04, 0.08, 0.04],
        }}
        transition={{
          x: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
          y: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <AnimatePresence initial={false} mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      <div className="absolute bottom-[1.2vh] right-[1.5vw] z-40 flex items-center gap-2 opacity-40">
        {SCENE_KEYS.map((k, i) => (
          <div
            key={k}
            className="rounded-full transition-all"
            style={{
              width: i === sceneIndex ? '1.5vw' : '0.5vw',
              height: '0.5vw',
              background: i === sceneIndex ? '#25D366' : '#1e3a5f',
            }}
          />
        ))}
      </div>
    </div>
  );
}
