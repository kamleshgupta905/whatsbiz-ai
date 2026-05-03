import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { useVoiceover } from '@/lib/video/voiceover';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS = {
  hook: 8000,
  intro: 7000,
  aiReply: 9000,
  broadcast: 8000,
  dashboard: 9000,
  closing: 9000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook: Scene1,
  intro: Scene2,
  aiReply: Scene3,
  broadcast: Scene4,
  dashboard: Scene5,
  closing: Scene6,
};

const bgPositions = [
  { x: '45vw', y: '40vh', scale: 2.2, opacity: 0.12 },
  { x: '10vw', y: '15vh', scale: 1.5, opacity: 0.08 },
  { x: '70vw', y: '55vh', scale: 1.8, opacity: 0.1 },
  { x: '20vw', y: '65vh', scale: 1.3, opacity: 0.09 },
  { x: '55vw', y: '20vh', scale: 2.0, opacity: 0.11 },
  { x: '30vw', y: '50vh', scale: 2.4, opacity: 0.13 },
];

const accentPositions = [
  { x: '80vw', y: '20vh', rotate: 0 },
  { x: '5vw', y: '70vh', rotate: 45 },
  { x: '60vw', y: '80vh', rotate: 90 },
  { x: '15vw', y: '25vh', rotate: 135 },
  { x: '75vw', y: '60vh', rotate: 180 },
  { x: '40vw', y: '10vh', rotate: 225 },
];

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

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const bgPos = bgPositions[sceneIndex] ?? bgPositions[0];
  const accPos = accentPositions[sceneIndex] ?? accentPositions[0];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#060F1E]">
      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full bg-[#25D366] blur-[120px] pointer-events-none"
        animate={{ x: bgPos.x, y: bgPos.y, scale: bgPos.scale, opacity: bgPos.opacity }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ left: '-10vw', top: '-10vh' }}
      />
      <motion.div
        className="absolute w-[30vw] h-[30vw] rounded-full bg-[#FF6B35] blur-[100px] pointer-events-none"
        animate={{
          x: sceneIndex % 2 === 0 ? '70vw' : '10vw',
          y: sceneIndex % 2 === 0 ? '70vh' : '10vh',
          opacity: [0.04, 0.07, 0.04],
        }}
        transition={{ x: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }, y: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      />

      <motion.div
        className="absolute w-[2px] h-[15vh] bg-gradient-to-b from-[#25D366]/0 via-[#25D366]/60 to-[#25D366]/0 pointer-events-none"
        animate={{ x: accPos.x, y: accPos.y, rotate: accPos.rotate, opacity: sceneIndex === 5 ? 0 : 0.5 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ left: 0, top: 0 }}
      />
      <motion.div
        className="absolute w-[6vw] h-[6vw] rounded-full border border-[#25D366]/20 pointer-events-none"
        animate={{
          x: sceneIndex % 2 === 0 ? '85vw' : '5vw',
          y: sceneIndex % 3 === 0 ? '10vh' : sceneIndex % 3 === 1 ? '50vh' : '80vh',
          scale: [1, 1.1, 1],
        }}
        transition={{ x: { duration: 1.2 }, y: { duration: 1.2 }, scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      />

      <AnimatePresence initial={false} mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
