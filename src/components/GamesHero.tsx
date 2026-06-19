import { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/carousel.css';
import '../styles/shimmer.css';
import bibleQuizBanner from '../assets/GameBanners/BibleQuizb.png';
import KiswahiliB from '../assets/GameBanners/kiswahilib.png';
import ConnectFour from '../assets/GameBanners/connectfourb.png';
import BongoQuiz from '../assets/Games/bongoquiz.png';
import Sudoku from '../assets/GameBanners/sudokub.png';
import checkers from '../assets/GameBanners/checkers-banner.png';
import chessbanner from '../assets/GameBanners/chess-banner.png';

interface Tag {
    label: string;
    type: 'trending' | 'hot' | 'new';
}

interface Slide {
    id: number;
    gameId: string;
    title: string;
    image: string;
    tags: Tag[];
    points: string;
    ctaText?: string;
    accentColor: string;
}

export const GamesHero = () => {
    const [currentSlide, setCurrentSlide] = useState<number>(0);
    const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});
    const [failedImages, setFailedImages] = useState<{ [key: string]: boolean }>({});
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // const { handleGameClick } = useGameClick();
    const minSwipeDistance = 50;

    const slides: Slide[] = [
        {
            id: 1,
            gameId: "bongo-quiz",
            title: "BongoQuiz",
            image: BongoQuiz,
            points: "",
            accentColor: "#00c6ff",
            tags: [{ label: "NEW", type: "new" }],
            ctaText: "PLAY NOW"
        },
        {
            id: 2,
            gameId: "connect-four",
            title: "Connect Four",
            image: ConnectFour,
            points: "",
            accentColor: "#fd3f3f",
            tags: [{ label: "HOT", type: "hot" }],
            ctaText: "PLAY NOW"
        },
        {
            id: 3,
            gameId: "chess",
            title: "CHESS MASTER",
            image: chessbanner,
            points: "WIN UP TO 1500 POINTS!",
            accentColor: "#f5a623",
            tags: [{ label: "TRENDING", type: "trending" }],
            ctaText: "PLAY NOW"
        },
        {
            id: 4,
            gameId: "checkers",
            title: "CHECKERS",
            image: checkers,
            points: "WIN UP TO 800 POINTS!",
            accentColor: "#00c6ff",
            tags: [{ label: "NEW", type: "new" }],
            ctaText: "PLAY NOW"
        }, {
            id: 5,
            gameId: "bible-quiz",
            title: "BIBLE QUIZ",
            image: bibleQuizBanner,
            points: "WIN UP TO 1000 POINTS!",
            accentColor: "#00f5d4",
            tags: [{ label: "NEW", type: "new" }],
            ctaText: "PLAY NOW"
        },
        {
            id: 6,
            gameId: "sodoku",
            title: "Sudoku",
            image: Sudoku,
            points: "",
            accentColor: "#00c6ff",
            tags: [{ label: "NEW", type: "new" }],
            ctaText: "PLAY NOW"
        }, {
            id: 7,
            gameId: "kiswahili-quiz",
            title: "Kiswahili Quiz",
            image: KiswahiliB,
            points: "",
            accentColor: "#ff7d37",
            tags: [{ label: "NEW", type: "new" }],
            ctaText: "PLAY NOW"
        }
    ];

    // const handleGameButtonClick = (gameId: string) => {
    //     const gameData = slides.find(s => s.gameId === gameId);
    //     handleGameClick(gameId, gameData as any);
    // };

    const goToSlide = useCallback((index: number) => {
        setCurrentSlide(index);
    }, []);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    // Touch handlers
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (Math.abs(distance) > minSwipeDistance) {
            if (distance > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    };

    // Auto-advance slides
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (!isHovering) {
            intervalRef.current = setInterval(nextSlide, 5000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isHovering, nextSlide]);

    const handleImageLoad = (url: string) => {
        setLoadedImages(prev => ({ ...prev, [url]: true }));
    };

    const handleImageError = (url: string) => {
        setFailedImages(prev => ({ ...prev, [url]: true }));
    };

    // Preload all images on mount
    useEffect(() => {
        slides.forEach(slide => {
            if (!loadedImages[slide.image] && !failedImages[slide.image]) {
                const img = new Image();
                img.src = slide.image;
                img.onload = () => handleImageLoad(slide.image);
                img.onerror = () => handleImageError(slide.image);
            }
        });
    }, []);

    const getTagClass = (type: string) => {
        const classes = {
            trending: 'tag-trending',
            hot: 'tag-hot',
            new: 'tag-new'
        };
        return classes[type as keyof typeof classes] ?? '';
    };

    const active = slides[currentSlide];

    return (
        <div
            className="hs-root"
            style={{ '--accent': active.accentColor } as React.CSSProperties}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Main slider container */}
            <div
                className="hs-stage"
                ref={sliderRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Slides */}
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`hs-slide ${index === currentSlide ? 'hs-slide-active' : ''}`}
                    >
                        {/* Shimmer overlay while loading */}
                        {!loadedImages[slide.image] && !failedImages[slide.image] && (
                            <div className="hero-shimmer-overlay">
                                <div className="shimmer-effect" />
                            </div>
                        )}

                        {/* Background image */}
                        {!failedImages[slide.image] && (
                            <img
                                src={slide.image}
                                alt=""
                                aria-hidden="true"
                                className="hs-bg-img"
                                onLoad={() => handleImageLoad(slide.image)}
                                onError={() => handleImageError(slide.image)}
                                style={{ display: loadedImages[slide.image] ? 'block' : 'none' }}
                            />
                        )}

                        {/* Gradient overlay for text readability */}
                        <div className="hs-bg-overlay" />

                        {/* Content overlay - only show for active slide */}
                        {index === currentSlide && (
                            <div className="hs-content">
                                <div className="hs-tags">
                                    {slide.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className={`hs-tag ${getTagClass(tag.type)}`}
                                        >
                                            {tag.label}
                                        </span>
                                    ))}
                                </div>


                                {/*<div className="hs-points-badge">*/}
                                {/*    <span className="hs-points-icon">⚡</span>*/}
                                {/*    {slide.points}*/}
                                {/*</div>*/}
                                {/*<h2 className="hs-title">{slide.title}</h2>*/}


                                {/*<button*/}
                                {/*    className="hs-cta"*/}
                                {/*    onClick={() => handleGameButtonClick(slide.gameId)}*/}
                                {/*>*/}
                                {/*    {slide.ctaText}*/}
                                {/*</button>*/}
                            </div>
                        )}
                    </div>
                ))}

                {/* Navigation dots */}
                <div className="hs-dots">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            className={`hs-dot ${i === currentSlide ? 'hs-dot-active' : ''}`}
                            onClick={() => goToSlide(i)}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Navigation arrows */}
                <button
                    className="hs-nav hs-nav-prev"
                    onClick={prevSlide}
                    aria-label="Previous slide"
                >
                    ‹
                </button>

                <button
                    className="hs-nav hs-nav-next"
                    onClick={nextSlide}
                    aria-label="Next slide"
                >
                    ›
                </button>
            </div>
        </div>
    );
};

