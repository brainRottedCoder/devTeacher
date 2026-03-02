import { useState, useEffect, useCallback } from "react";
import {
    Company,
    InterviewQuestion,
    GetQuestionsParams,
    StudyPlan
} from "@/types/interview.types";

export function useCompanies() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCompanies = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/interview/companies");
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setCompanies(data.companies || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch companies");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    return { companies, loading, error, refetch: fetchCompanies };
}

export function useQuestions(params: GetQuestionsParams) {
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    const fetchQuestions = useCallback(async () => {
        try {
            setLoading(true);

            const queryParams = new URLSearchParams();
            if (params.companyId) queryParams.set("company_id", params.companyId);
            if (params.type) queryParams.set("type", params.type);
            if (params.difficulty) queryParams.set("difficulty", params.difficulty);
            if (params.topic) queryParams.set("topic", params.topic);
            if (params.limit) queryParams.set("limit", params.limit.toString());
            if (params.offset) queryParams.set("offset", params.offset.toString());

            const response = await fetch(`/api/interview/questions?${queryParams}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setQuestions(data.questions || []);
            setTotal(data.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch questions");
        } finally {
            setLoading(false);
        }
    }, [params.companyId, params.type, params.difficulty, params.topic, params.limit, params.offset]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    return { questions, loading, error, total, refetch: fetchQuestions };
}

export function useStudyPlans() {
    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/interview/plans");
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setPlans(data.plans || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch plans");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    return { plans, loading, error, refetch: fetchPlans };
}
