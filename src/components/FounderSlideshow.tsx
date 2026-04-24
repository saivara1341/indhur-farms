import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import founder1 from "@/assets/founder-1.jpg";
import founder2 from "@/assets/founder-2.jpg";

const images = [founder1, founder2];
const SLICE_COUNT = 8; // Number of vertical slices

interface FounderSlideshowProps {
    className?: string;
    interval?: number;
}

const FounderSlideshow = ({ className = "", interval = 5000 }: FounderSlideshowProps) => {
    const [index, setIndex] = useState(0);
    const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, interval);
        return () => clearInterval(timer);
    }, [interval]);

    const handleImageLoad = (src: string) => {
        setImagesLoaded(prev => ({ ...prev, [src]: true }));
    };

    return (
        <div className={`relative overflow-hidden bg-black ${className}`}>
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={images[index]}
                    className="absolute inset-0 flex"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    {Array.from({ length: SLICE_COUNT }).map((_, i) => (
                        <div
                            key={i}
                            className="relative h-full overflow-hidden"
                            style={{ width: `${100 / SLICE_COUNT}%` }}
                        >
                            {!imagesLoaded[images[index]] && i === 0 && (
                                <Skeleton className="absolute inset-0 z-0 h-full w-[800%] transform -translate-x-[12.5%]" />
                            )}
                            <motion.img
                                src={images[index]}
                                className="absolute h-full object-cover"
                                onLoad={() => handleImageLoad(images[index])}
                                loading={index === 0 ? "eager" : "lazy"}
                                fetchPriority={index === 0 ? "high" : "auto"}
                                style={{
                                    width: `${SLICE_COUNT * 100}%`,
                                    left: `${-i * 100}%`,
                                    maxWidth: "none",
                                    visibility: imagesLoaded[images[index]] ? "visible" : "hidden"
                                }}
                                variants={{
                                    initial: {
                                        y: i % 2 === 0 ? "100%" : "-100%",
                                        opacity: 0,
                                        scale: 1.2
                                    },
                                    animate: {
                                        y: "0%",
                                        opacity: 1,
                                        scale: 1,
                                        transition: {
                                            duration: 1.2,
                                            ease: [0.22, 1, 0.36, 1],
                                            delay: i * 0.08
                                        }
                                    },
                                    exit: {
                                        y: i % 2 === 0 ? "-100%" : "100%",
                                        opacity: 0,
                                        transition: {
                                            duration: 0.8,
                                            ease: [0.22, 1, 0.36, 1],
                                            delay: i * 0.05
                                        }
                                    }
                                }}
                                alt="Our Founder"
                            />
                        </div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10" />

            {/* Progress Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {images.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-700 ease-out ${i === index ? "w-10 bg-white" : "w-2.5 bg-white/30"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default FounderSlideshow;
