import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { MAX_TRAVEL_SECONDS } from '../utils/gameMath.js';

export default function RocketScene({ elapsed, status }) {
  const progress = Math.min(elapsed / MAX_TRAVEL_SECONDS, 1);
  const y = 220 - progress * 350;

  return (
    <section className={`rocket-scene ${status}`}>
      <div className="stars" />
      <div className="moon" />
      <motion.div
        className="rocket-wrap"
        animate={{
          y,
          rotate: status === 'lost' ? 70 : -12,
          scale: status === 'lost' ? 0.9 : 1
        }}
        transition={{ type: 'spring', stiffness: 70, damping: 16 }}
      >
        <Rocket size={64} strokeWidth={1.8} />
        {status === 'flying' && <span className="flame" />}
      </motion.div>
      {status === 'lost' && <div className="explosion">BOOM</div>}
      {status === 'won' && <div className="landing">LANDED</div>}
    </section>
  );
}
