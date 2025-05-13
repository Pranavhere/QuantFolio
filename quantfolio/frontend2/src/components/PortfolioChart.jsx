import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const PortfolioChart = ({ timestamps, values, isLoading, error }) => {
    const chartData = useMemo(() => ({
        labels: timestamps?.map((ts) => new Date(ts).toLocaleDateString()) || [],
        datasets: [
            {
                label: 'Portfolio Value',
                data: values || [],
                borderColor: 'hsl(var(--primary))',
                borderWidth: 3,
                backgroundColor: 'var(--chart-fill)',
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'hsl(var(--primary))',
                pointBorderWidth: 2,
            },
        ],
    }), [timestamps, values]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Date' } },
            y: { title: { display: true, text: 'Value ($)' } },
        },
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: (context) => `$${context.parsed.y.toFixed(2)}`,
                },
            },
        },
    }), []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="h-64 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="h-64 flex items-center justify-center text-red-500">
                    {error}
                </div>
            );
        }

        if (!timestamps?.length || !values?.length) {
            return (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                </div>
            );
        }

        return (
            <div className="h-64">
                <Line data={chartData} options={options} />
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

PortfolioChart.propTypes = {
    timestamps: PropTypes.arrayOf(PropTypes.string),
    values: PropTypes.arrayOf(PropTypes.number),
    isLoading: PropTypes.bool,
    error: PropTypes.string,
};

PortfolioChart.defaultProps = {
    timestamps: [],
    values: [],
    isLoading: false,
    error: null,
};

export default React.memo(PortfolioChart);