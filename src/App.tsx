import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Terminal } from 'lucide-react';

// --- Types ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 70;

const TRACKS = [
  { id: 1, title: 'AI_GEN_SEQ_01.WAV', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'NEURAL_NET_LULLABY.MP3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'CYBER_VOID_AMBIENCE.FLAC', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isPlayingGame, setIsPlayingGame] = useState<boolean>(false);

  // --- Audio State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Refs for Game Loop ---
  const directionRef = useRef<Direction>(direction);
  const gameLoopRef = useRef<number | null>(null);

  // --- Audio Controls ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlayingAudio, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlayAudio = () => setIsPlayingAudio(!isPlayingAudio);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  const toggleMute = () => setIsMuted(!isMuted);

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    let isOccupied = true;
    while (isOccupied) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      isOccupied = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    return newFood!;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setIsPlayingGame(true);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPlayingGame || gameOver) {
      if (e.code === 'Space') {
        e.preventDefault();
        resetGame();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (directionRef.current !== 'DOWN') setDirection('UP');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (directionRef.current !== 'UP') setDirection('DOWN');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (directionRef.current !== 'RIGHT') setDirection('LEFT');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (directionRef.current !== 'LEFT') setDirection('RIGHT');
        break;
    }
  }, [isPlayingGame, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const gameStep = useCallback(() => {
    if (gameOver || !isPlayingGame) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collisions
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true);
        setIsPlayingGame(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, isPlayingGame, food, generateFood]);

  useEffect(() => {
    if (isPlayingGame) {
      gameLoopRef.current = window.setInterval(gameStep, GAME_SPEED);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlayingGame, gameStep]);


  return (
    <div className="min-h-screen bg-[#050505] text-cyan-400 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="scanlines"></div>
      <div className="crt-flicker"></div>
      <div className="static-noise"></div>

      {/* Header */}
      <header className="absolute top-6 left-6 z-10 flex items-center gap-4 tear">
        <Terminal className="w-8 h-8 text-fuchsia-500 animate-pulse" />
        <div>
          <h1 className="text-2xl font-bold glitch-text tracking-widest" data-text="NEON_SERPENT_OS">NEON_SERPENT_OS</h1>
          <p className="text-xs text-fuchsia-400 opacity-80">SYS.VER. 9.4.2 // ONLINE // MEM_ADDR: 0x00F3A2</p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="z-10 flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-6xl mt-16">
        
        {/* Left Panel: Music Player */}
        <div className="w-full md:w-80 bg-black/80 border-glitch p-6 flex flex-col gap-6 backdrop-blur-sm tear">
          <div className="border-b border-cyan-500/30 pb-2 mb-2 flex justify-between items-end">
            <h2 className="text-lg text-fuchsia-500 glitch-text" data-text="AUDIO_DECODER_MODULE">AUDIO_DECODER_MODULE</h2>
            <span className="text-[10px] text-cyan-700">PID: 8492</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center gap-4 py-4">
            <div className="w-full h-24 bg-[#111] border border-cyan-900 flex items-center justify-center relative overflow-hidden">
              {isPlayingAudio ? (
                <div className="flex items-end gap-1 h-12">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-2 bg-cyan-400" 
                      style={{ 
                        height: `${Math.random() * 100}%`,
                        animation: `pulse ${0.2 + Math.random() * 0.5}s infinite alternate`
                      }}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-cyan-800 text-sm">AWAITING_SIGNAL...</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            </div>

            <div className="w-full text-center">
              <p className="text-xs text-cyan-600 mb-1">CURRENT_WAVEFORM:</p>
              <p className="text-sm truncate text-fuchsia-300 font-bold">
                {TRACKS[currentTrackIndex].title}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-cyan-500/30">
            <button onClick={toggleMute} className="p-2 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] hover:drop-shadow-[0_0_12px_rgba(0,255,255,1)] hover:scale-110">
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <div className="flex gap-4 items-center">
              <button onClick={prevTrack} className="p-2 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] hover:drop-shadow-[0_0_12px_rgba(0,255,255,1)] hover:scale-110">
                <SkipBack size={24} fill="currentColor" />
              </button>
              <button onClick={togglePlayAudio} className="p-2 text-fuchsia-500 hover:text-fuchsia-400 transition-all cursor-pointer drop-shadow-[0_0_10px_rgba(255,0,255,0.8)] hover:drop-shadow-[0_0_15px_rgba(255,0,255,1)] hover:scale-110">
                {isPlayingAudio ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
              <button onClick={nextTrack} className="p-2 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] hover:drop-shadow-[0_0_12px_rgba(0,255,255,1)] hover:scale-110">
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>
          </div>
          
          <audio 
            ref={audioRef} 
            src={TRACKS[currentTrackIndex].url} 
            onEnded={nextTrack}
            loop={false}
          />
        </div>

        {/* Center Panel: Snake Game */}
        <div className="flex flex-col items-center gap-4 tear">
          <div className="flex justify-between w-full px-2 items-end mb-2">
            <div className="flex items-end gap-2 text-4xl font-bold tracking-widest">
              <div className="text-fuchsia-500 glitch-text" data-text="DATA_HARVESTED:">DATA_HARVESTED:</div>
              <div className="text-cyan-400 glitch-text" data-text={score.toString().padStart(4, '0')}>{score.toString().padStart(4, '0')}</div>
            </div>
            <div className="text-cyan-600 text-sm flex items-end pb-1">
              {gameOver ? 'SYS_STATE: FATAL_ERROR' : isPlayingGame ? 'SYS_STATE: EXECUTING' : 'SYS_STATE: IDLE'}
            </div>
          </div>

          <div className="relative">
            <div 
              className="snake-grid" 
              style={{ width: `${GRID_SIZE * 20}px`, height: `${GRID_SIZE * 20}px` }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const snakeIndex = snake.findIndex(s => s.x === x && s.y === y);
                const isHead = snakeIndex === 0;
                const isBody = snakeIndex > 0;
                const isFood = food.x === x && food.y === y;

                let className = 'snake-cell';
                let style: React.CSSProperties = {};

                if (isHead) {
                  className += ' snake-head';
                } else if (isBody) {
                  className += ' snake-body';
                  const intensity = 1 - (snakeIndex / snake.length) * 0.85;
                  style = {
                    backgroundColor: `rgba(0, 255, 255, ${intensity})`,
                    boxShadow: `0 0 ${12 * intensity}px rgba(0, 255, 255, ${intensity})`
                  };
                } else if (isFood) {
                  className += ' snake-food';
                }

                return <div key={i} className={className} style={style} />;
              })}
            </div>

            {(!isPlayingGame || gameOver) && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm border-2 border-fuchsia-500 z-20">
                {gameOver ? (
                  <>
                    <h2 className="text-4xl text-fuchsia-500 mb-2 glitch-text" data-text="CRITICAL_FAILURE">CRITICAL_FAILURE</h2>
                    <p className="text-cyan-400 mb-6">TOTAL_DATA_YIELD: {score}</p>
                  </>
                ) : (
                  <h2 className="text-3xl text-cyan-400 mb-6 glitch-text" data-text="INITIALIZE_PROTOCOL">INITIALIZE_PROTOCOL</h2>
                )}
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-transparent border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all font-bold tracking-widest cursor-pointer"
                >
                  {gameOver ? 'INITIATE_REBOOT' : 'EXECUTE_OVERRIDE'}
                </button>
                <p className="text-xs text-cyan-700 mt-4">INPUT_VECTORS: [W,A,S,D] // [ARROWS]</p>
              </div>
            )}
          </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="absolute bottom-4 right-6 z-10 text-xs text-cyan-800 flex flex-col items-end">
        <p>WARNING: UNAUTHORIZED ACCESS DETECTED.</p>
        <p className="opacity-50">01001110 01000101 01001111 01001110</p>
      </footer>
    </div>
  );
}
