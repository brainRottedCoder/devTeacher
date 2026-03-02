/**
 * Cloud Pricing API
 * Provides real-time cost estimation for cloud infrastructure
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    calculateInfrastructureCost,
    compareCloudProviders,
    CloudProvider,
    ComponentCostBreakdown
} from '@/lib/cloud-pricing';
import { ComponentType } from '@/lib/simulation/types';

interface ComponentInput {
    type: ComponentType;
    config: {
        instances?: number;
        cpuCores?: number;
        memoryGB?: number;
        databaseType?: 'postgres' | 'mysql' | 'mongodb' | 'redis';
        storageGB?: number;
        readReplicas?: number;
        cacheSizeGB?: number;
        edgeLocations?: number;
        storageType?: 's3' | 'gcs' | 'azure-blob';
        redundancy?: 'standard' | 'high';
        queueType?: 'rabbitmq' | 'kafka' | 'sqs';
    };
    requestsPerSecond?: number;
}

interface PricingRequest {
    components: ComponentInput[];
    provider?: CloudProvider;
    region?: string;
}

/**
 * POST /api/cloud-pricing/calculate
 * Calculate infrastructure cost for given components
 */
export async function POST(request: NextRequest) {
    try {
        const body: PricingRequest = await request.json();
        const { components, provider = 'aws', region = 'us-east-1' } = body;

        if (!components || !Array.isArray(components) || components.length === 0) {
            return NextResponse.json(
                { error: 'Components array is required' },
                { status: 400 }
            );
        }

        const result = calculateInfrastructureCost(components, {
            provider,
            region,
            currency: 'USD',
            monthlyHours: 730,
        });

        return NextResponse.json({
            success: true,
            provider: result.provider,
            region: result.region,
            cost: result.totalCost,
            breakdown: result.breakdown,
            currency: 'USD',
        });
    } catch (error) {
        console.error('Pricing calculation error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate pricing' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/cloud-pricing/compare
 * Compare costs across all three providers
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const componentsParam = searchParams.get('components');

        let components: ComponentInput[] = [];

        if (componentsParam) {
            try {
                components = JSON.parse(componentsParam);
            } catch {
                return NextResponse.json(
                    { error: 'Invalid components JSON' },
                    { status: 400 }
                );
            }
        }

        if (components.length === 0) {
            // Return sample comparison for demo
            components = [
                { type: 'server', config: { instances: 2, cpuCores: 2, memoryGB: 4 }, requestsPerSecond: 100 },
                { type: 'database', config: { databaseType: 'postgres', storageGB: 100, readReplicas: 1 }, requestsPerSecond: 50 },
                { type: 'cache', config: { cacheSizeGB: 2 }, requestsPerSecond: 200 },
            ];
        }

        const comparison = compareCloudProviders(components);

        // Calculate savings
        const providers = ['aws', 'gcp', 'azure'] as const;
        const cheapest = providers.reduce((min, p) =>
            comparison[p].monthlyEstimate < comparison[min].monthlyEstimate ? p : min
            , 'aws' as typeof providers[0]);

        return NextResponse.json({
            success: true,
            comparison: {
                aws: {
                    ...comparison.aws,
                    provider: 'AWS',
                    region: 'us-east-1',
                },
                gcp: {
                    ...comparison.gcp,
                    provider: 'GCP',
                    region: 'us-central1',
                },
                azure: {
                    ...comparison.azure,
                    provider: 'Azure',
                    region: 'East US',
                },
            },
            recommended: cheapest,
            savings: {
                'vs-aws': cheapest === 'aws' ? 0 : Math.round((comparison.aws.monthlyEstimate - comparison[cheapest].monthlyEstimate) / comparison.aws.monthlyEstimate * 100),
                'vs-gcp': cheapest === 'gcp' ? 0 : Math.round((comparison.gcp.monthlyEstimate - comparison[cheapest].monthlyEstimate) / comparison.gcp.monthlyEstimate * 100),
                'vs-azure': cheapest === 'azure' ? 0 : Math.round((comparison.azure.monthlyEstimate - comparison[cheapest].monthlyEstimate) / comparison.azure.monthlyEstimate * 100),
            },
        });
    } catch (error) {
        console.error('Pricing comparison error:', error);
        return NextResponse.json(
            { error: 'Failed to compare pricing' },
            { status: 500 }
        );
    }
}
