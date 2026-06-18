import { motion } from 'framer-motion';
import moonGold from '../assets/images/moon-gold.png';
import rocket from '../assets/images/Rocket.png2';
import { MAX_TRAVEL_SECONDS } from '../utils/gameMath.js';

export default function RocketScene({ elapsed, status }) {
  const progress = Math.min(elapsed / MAX_TRAVEL_SECONDS, 1);
  const y = 220 - progress * 350;

  return (
    <section className={`rocket-scene ${status}`}>
      <div className="stars" />
      <img src={moonGold} alt="" className="moonGold" />
      <motion.div
        className="rocket-wrap"
        animate={{
          y,
          rotate: status === 'lost' ? 50 : 0,
          scale: status === 'lost' ? 1 : 1
        }}
        transition={{ type: 'spring', stiffness: 70, damping: 16 }}
      >
        <img src={rocket} alt="" className="rocket" />
        {status === 'flying' && <span className="flame" />}
      </motion.div>
      {status === 'lost' && <div className="explosion">BOOM!</div>}
      {status === 'won' && <div className="landing">LANDED</div>}
    </section>
  );
}
