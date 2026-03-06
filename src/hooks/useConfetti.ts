import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const triggerConfetti = (type: 'buy' | 'sell' = 'buy') => {
    const colors = type === 'buy' 
      ? ['#22c55e', '#16a34a', '#4ade80', '#86efac'] // green shades
      : ['#ef4444', '#dc2626', '#f87171', '#fca5a5']; // red shades

    // First burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    // Second burst with slight delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
    }, 300);
  };

  return { triggerConfetti };
};
