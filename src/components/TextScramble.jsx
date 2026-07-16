import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const defaultChars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const matchCase = (targetChar, randomChar) => {
  if (targetChar.toUpperCase() !== targetChar.toLowerCase()) {
    if (targetChar === targetChar.toUpperCase()) return randomChar.toUpperCase();
    if (targetChar === targetChar.toLowerCase()) return randomChar.toLowerCase();
  }
  return randomChar;
};

export function TextScramble({
  children,
  duration = 0.8,
  speed = 0.04,
  characterSet = defaultChars,
  className,
  as: Component = 'p',
  trigger = true,
  scrambleMode = 'char',
  onScrambleComplete,
  ...props
}) {
  const MotionComponent = motion.create(Component);
  const [scrambledText, setScrambledText] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const text = children;
  const displayText = scrambledText ?? children;

  const scramble = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const steps = duration / speed;
    let step = 0;

    const getCharFor = (target) => {
      const isNum = /[0-9]/.test(target);
      const pool = isNum
        ? characterSet.replace(/[^0-9]/g, '') || '0123456789'
        : characterSet.replace(/[0-9]/g, '') || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      const randomChar = pool[Math.floor(Math.random() * pool.length)];
      return matchCase(target, randomChar);
    };

    const interval = setInterval(() => {
      let scrambled = '';
      const progress = step / steps;

      if (scrambleMode === 'word') {
        const words = text.split(' ');
        for (let w = 0; w < words.length; w++) {
          if (progress * words.length > w) {
            scrambled += words[w] + (w < words.length - 1 ? ' ' : '');
          } else {
            let scrambledWord = '';
            for (let i = 0; i < words[w].length; i++) {
              scrambledWord += getCharFor(words[w][i]);
            }
            scrambled += scrambledWord + (w < words.length - 1 ? ' ' : '');
          }
        }
      } else {
        for (let i = 0; i < text.length; i++) {
          if (text[i] === ' ') {
            scrambled += ' ';
            continue;
          }

          if (progress * text.length > i) {
            scrambled += text[i];
          } else {
            scrambled += getCharFor(text[i]);
          }
        }
      }

      setScrambledText(scrambled);
      step++;

      if (step > steps) {
        clearInterval(interval);
        setScrambledText(null);
        setIsAnimating(false);
        onScrambleComplete?.();
      }
    }, speed * 1000);
  };

  useEffect(() => {
    if (!trigger) return;

    scramble();
  }, [trigger]);

  return (
    <MotionComponent className={className} {...props}>
      {displayText}
    </MotionComponent>
  );
}
