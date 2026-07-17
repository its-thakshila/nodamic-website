import React from 'react';
import './HeroContent.css';
import wordmark from '../assets/wordmark.svg';
import { TextScramble } from './TextScramble';

export default function HeroContent({ visible }) {
  return (
    <div className={`hero-content-root ${visible ? 'visible' : ''}`}>
      <div className="hero-logo-wrapper">
        <div className="hero-logo-base-glow">
          <img src={wordmark} alt="Nodamic Logo" className="hero-logo-base" />
        </div>
        <img src={wordmark} alt="" className="hero-logo-glitch layer-1-entry" />
        <img src={wordmark} alt="" className="hero-logo-glitch layer-2-entry" />
        <img src={wordmark} alt="" className="hero-logo-glitch layer-1-hover" />
        <img src={wordmark} alt="" className="hero-logo-glitch layer-2-hover" />
      </div>
      <h1 className="hero-headline">
        <TextScramble as="span" trigger={visible} duration={0.5}>Unthink</TextScramble>{' '}
        <TextScramble as="span" className="hero-headline-highlight" trigger={visible} duration={0.5}>the</TextScramble>{' '}
        <TextScramble as="span" trigger={visible} duration={0.5}>Ordinary</TextScramble>
      </h1>
      <TextScramble
        as="p"
        className="hero-subheadline"
        trigger={visible}
        duration={0.5}
        scrambleMode="word"
      >
        Creating intelligent, minimalist technology products that redefine everyday experiences.
      </TextScramble>
    </div>
  );
}
