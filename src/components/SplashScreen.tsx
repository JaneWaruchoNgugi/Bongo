import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';

export function SplashScreen({ onDone }: { onDone: () => void }) {
    const [hiding, setHiding] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setHiding(true), 1800);
        const t2 = setTimeout(onDone, 2300);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [onDone]);

    return (
        <div className={`splash-root ${hiding ? 'splash-hide' : ''}`}>
            <div className="splash-logo">
                <GraduationCap size={52} color="#5fae84" />
                <span className="splash-wordmark">High <strong>Scores</strong></span>
            </div>
            <div className="splash-bar"><div className="splash-bar-fill" /></div>
        </div>
    );
}
