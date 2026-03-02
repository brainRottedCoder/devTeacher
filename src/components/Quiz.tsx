"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Loader2 } from "lucide-react";
import { Quiz as QuizType, QuizAttempt, useSubmitQuizAttempt } from "@/hooks/useQuiz";

interface QuizProps {
    quiz: QuizType;
    lessonId: string;
    onComplete?: (passed: boolean) => void;
}

export function Quiz({ quiz, lessonId, onComplete }: QuizProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [showResults, setShowResults] = useState(false);
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

    const submitQuiz = useSubmitQuizAttempt();

    const questions = quiz.questions || [];
    const currentQ = questions[currentQuestion];
    const isLastQuestion = currentQuestion === questions.length - 1;
    const hasAnsweredCurrent = answers[currentQuestion] !== undefined;

    const handleSelectAnswer = (answerIndex: number) => {
        if (showResults) return;
        setAnswers(prev => ({
            ...prev,
            [currentQuestion]: answerIndex
        }));
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        // Convert answers object to array
        const answerArray = questions.map((_, index) => answers[index] ?? -1);

        try {
            const result = await submitQuiz.mutateAsync({
                quiz_id: quiz.id,
                answers: answerArray
            });
            setAttempt(result);
            setShowResults(true);
            if (onComplete) {
                onComplete(result.passed);
            }
        } catch (error) {
            console.error("Failed to submit quiz:", error);
        }
    };

    const handleRetry = () => {
        setCurrentQuestion(0);
        setAnswers({});
        setShowResults(false);
        setAttempt(null);
    };

    // Show results view
    if (showResults && attempt) {
        return (
            <div className="card">
                <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${attempt.passed ? "bg-green-100" : "bg-red-100"
                        }`}>
                        {attempt.passed ? (
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                            <XCircle className="w-8 h-8 text-red-600" />
                        )}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                        {attempt.passed ? "Congratulations!" : "Keep Learning!"}
                    </h3>
                    <p className="text-gray-600">
                        You scored <span className="font-bold text-primary-600">{attempt.score}%</span>
                        ({attempt.correctCount}/{attempt.totalQuestions} correct)
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Passing score: {quiz.passing_score}%
                    </p>
                </div>

                {/* Question Results */}
                <div className="space-y-4 mb-6">
                    {attempt.results.map((result, index) => (
                        <div key={result.questionId} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-3">
                                {result.isCorrect ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800 mb-2">
                                        Q{index + 1}: {questions[index]?.question}
                                    </p>
                                    {!result.isCorrect && (
                                        <p className="text-sm text-red-600 mb-1">
                                            Your answer: {questions[index]?.options[result.userAnswer] || "No answer"}
                                        </p>
                                    )}
                                    <p className="text-sm text-green-600 mb-2">
                                        Correct: {questions[index]?.options[result.correctAnswer]}
                                    </p>
                                    {result.explanation && (
                                        <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                                            💡 {result.explanation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleRetry}
                        className="btn-secondary flex items-center gap-2 flex-1 justify-center"
                    >
                        <RotateCcw size={18} />
                        Try Again
                    </button>
                    <button
                        onClick={() => {
                            handleRetry();
                            if (onComplete) onComplete(attempt.passed);
                        }}
                        className="btn-primary flex items-center gap-2 flex-1 justify-center"
                    >
                        Continue
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // Quiz in progress
    return (
        <div className="card">
            {/* Progress bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Question {currentQuestion + 1} of {questions.length}</span>
                    <span>{Object.keys(answers).length} answered</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-600 transition-all duration-300"
                        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">
                    {currentQ?.question}
                </h3>
                <div className="space-y-3">
                    {currentQ?.options.map((option, index) => {
                        const isSelected = answers[currentQuestion] === index;
                        return (
                            <button
                                key={index}
                                onClick={() => handleSelectAnswer(index)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${isSelected
                                        ? "border-primary-600 bg-primary-50"
                                        : "border-gray-200 hover:border-primary-300"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary-600 bg-primary-600" : "border-gray-300"
                                        }`}>
                                        {isSelected && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <span className="text-gray-700">{option}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className={`px-4 py-2 rounded-lg transition-colors ${currentQuestion === 0
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    Previous
                </button>

                <div className="flex-1" />

                {isLastQuestion ? (
                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length < questions.length || submitQuiz.isPending}
                        className="btn-primary flex items-center gap-2"
                    >
                        {submitQuiz.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Quiz
                                <CheckCircle size={18} />
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={!hasAnsweredCurrent}
                        className={`btn-primary flex items-center gap-2 ${!hasAnsweredCurrent ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        Next
                        <ArrowRight size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}
