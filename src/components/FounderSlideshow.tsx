import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import founder1 from "@/assets/founder-1.jpg";
import founder2 from "@/assets/founder-2.jpg";

const images = [founder1, founder2];

interface FounderSlideshowProps {
    className?: string;
    interval?: number;
}

const FounderSlideshow = ({ className = "", interval = 5000 }: FounderSlideshowProps) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, interval);
        return () => clearInterval(timer);
    }, [interval]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <AnimatePresence mode="wait">
                <motion.img
                    key={images[index]}
                    src={images[index]}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 h-full w-full object-cover"
                    alt="Our Founder"
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

            {/* Progress Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {images.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${i === index ? "w-8 bg-white" : "w-2 bg-white/40"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default FounderSlideshow;
