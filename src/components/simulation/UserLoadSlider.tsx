"use client";

import { USER_LEVELS } from "@/lib/simulation/types";

interface UserLoadSliderProps {
    users: number;
    onChange: (users: number) => void;
}

export function UserLoadSlider({ users, onChange }: UserLoadSliderProps) {
    const currentIndex = USER_LEVELS.findIndex(
        (level, index) =>
            level.value === users ||
            (index < USER_LEVELS.length - 1 &&
                users > level.value &&
                users < USER_LEVELS[index + 1].value)
    );

    const currentLevel = USER_LEVELS.find((l) => l.value === users) || USER_LEVELS[0];

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        const level = USER_LEVELS[value];
        onChange(level.value);
    };

    const handleQuickSelect = (value: number) => {
        onChange(value);
    };

    // Helper to format large numbers
    const formatNumber = (num: number): string => {
        if (num >= 100000000) {
            return `${(num / 100000000).toFixed(0)}B`;
        }
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(0)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(0)}K`;
        }
        return num.toLocaleString();
    };

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">User Load Simulation</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {currentLevel.description}
                </span>
            </div>

            {/* Main slider */}
            <div className="relative mb-6">
                <input
                    type="range"
                    min={0}
                    max={USER_LEVELS.length - 1}
                    value={currentIndex >= 0 ? currentIndex : 0}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-gradient-to-r
            [&::-webkit-slider-thumb]:from-purple-500
            [&::-webkit-slider-thumb]:to-pink-500
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-purple-500/25
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-gradient-to-r
            [&::-moz-range-thumb]:from-purple-500
            [&::-moz-range-thumb]:to-pink-500
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, 
              rgb(139, 92, 246) 0%, 
              rgb(236, 72, 153) ${((currentIndex >= 0 ? currentIndex : 0) / (USER_LEVELS.length - 1)) * 100}%, 
              rgba(255,255,255,0.05) ${((currentIndex >= 0 ? currentIndex : 0) / (USER_LEVELS.length - 1)) * 100}%)`,
                    }}
                />

                {/* Tick marks */}
                <div className="absolute top-4 left-0 right-0 flex justify-between px-1">
                    {USER_LEVELS.map((level, index) => (
                        <div
                            key={level.value}
                            className={`w-1 h-1 rounded-full transition-colors ${index <= currentIndex
                                    ? "bg-purple-500"
                                    : "bg-white/20"
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Quick select buttons */}
            <div className="flex flex-wrap gap-1.5">
                {USER_LEVELS.map((level) => (
                    <button
                        key={level.value}
                        onClick={() => handleQuickSelect(level.value)}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${users === level.value
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                            }`}
                    >
                        {level.label}
                    </button>
                ))}
            </div>

            {/* Current value display */}
            <div className="mt-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-gradient mb-1 truncate max-w-[200px]">
                        {formatNumber(users)}
                    </div>
                    <div className="text-sm text-gray-400">simulated users</div>
                </div>
            </div>
        </div>
    );
}