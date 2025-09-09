import { useState, useEffect } from 'react';

const useCountUp = (target, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(target, 10);
    if (start === end) return;

    const incrementTime = (duration / end) * (end > 100 ? 10 : 1);

    const timer = setInterval(() => {
      start += (end > 100 ? 10 : 1);
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};

export default useCountUp;